"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import FieldError from "@/components/preferences/FieldError";
import { MENU_MAX_LENGTH, MENU_MIN_LENGTH, RecommendationRequest } from "@/lib/recommendations";

type MenuInputFormProps = {
  isLoading: boolean;
  onSubmit: (request: RecommendationRequest) => void;
};

type FieldErrors = { restaurantPlace?: string; menuText?: string };

// Shared look for the three fields inside the box
const fieldClass = "w-full bg-transparent px-4 text-sm text-error placeholder:text-secondary/60 focus:outline-none";

export default function MenuInputForm({ isLoading, onSubmit }: MenuInputFormProps) {
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantPlace, setRestaurantPlace] = useState("");
  const [menuText, setMenuText] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function validate(): boolean {
    const found: FieldErrors = {};
    // Location lets the AI consider how dishes are made locally
    if (!restaurantPlace.trim()) found.restaurantPlace = "Add the location (city and country) so we can consider local recipes.";
    if (!menuText.trim()) found.menuText = "Paste or type the menu.";
    else if (menuText.trim().length < MENU_MIN_LENGTH) found.menuText = `The menu needs at least ${MENU_MIN_LENGTH} characters.`;
    setErrors(found);
    return Object.keys(found).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); // stop the browser's default page reload
    if (!validate()) return;
    onSubmit({
      menuText: menuText.trim(),
      restaurantPlace: restaurantPlace.trim(),
      restaurantName: restaurantName.trim() || undefined,
    });
  }

  const hasError = Boolean(errors.restaurantPlace || errors.menuText);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-xl flex-col gap-3">
      {/* One box with three spaces: Location | Restaurant name on top, menu below */}
      <div
        className={`overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30
          ${hasError ? "border-error" : "border-error/30"}`}
      >
        <div className="flex divide-x divide-error/20 border-b border-error/20">
          <input
            aria-label="Location"
            aria-invalid={Boolean(errors.restaurantPlace)}
            name="restaurantPlace"
            placeholder="Location (e.g. Bologna, Italy)"
            maxLength={200}
            value={restaurantPlace}
            onChange={(e) => setRestaurantPlace(e.target.value)}
            className={`${fieldClass} h-12 ${errors.restaurantPlace ? "placeholder:text-error/70" : ""}`}
          />
          <input
            aria-label="Restaurant name"
            name="restaurantName"
            placeholder="Restaurant name"
            maxLength={200}
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            className={`${fieldClass} h-12`}
          />
        </div>

        <textarea
          aria-label="Menu"
          aria-invalid={Boolean(errors.menuText)}
          name="menuText"
          rows={4}
          maxLength={MENU_MAX_LENGTH}
          placeholder={"The menu: bring a list of dishes you want suggestions for. \n(E.g.: Tortellini in Brodo\nLasagna Bolognese\nPolpette in Umido dell'Orsa\nAffettati Misti)"}
          value={menuText}
          onChange={(e) => setMenuText(e.target.value)}
          className={`${fieldClass} block resize-y py-3`}
        />
        <p className="px-4 pb-2 text-right text-xs text-secondary">
          {menuText.length}/{MENU_MAX_LENGTH}
        </p>
      </div>

      {hasError && (
        <FieldError>
          {[errors.restaurantPlace, errors.menuText].filter(Boolean).join(" ")}
        </FieldError>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Reading the menu…" : "Get suggestions"}
        </Button>
        {/* <Button
          variant="secondary"
          disabled={isLoading || (!menuText && !restaurantName && !restaurantPlace)}
          onClick={() => {
            setRestaurantName("");
            setRestaurantPlace("");
            setMenuText("");
            setErrors({});
          }}
        >
          Clear
        </Button> */}
      </div>
    </form>
  );
}
