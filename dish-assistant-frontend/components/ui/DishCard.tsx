"use client";

import { useState } from "react";
import StarRating from "@/components/ui/StarRating";
import { LIKED_MIN_RATING, rateDish } from "@/lib/feedback";
import { RecommendedDish } from "@/lib/recommendations";

type DishCardProps = {
  dish: RecommendedDish;
};

type RatingState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; liked: boolean }
  | { status: "error"; message: string };

export default function DishCard({ dish }: DishCardProps) {
  const [rating, setRating] = useState(0);
  const [state, setState] = useState<RatingState>({ status: "idle" });

  async function handleRate(stars: number) {
    const previous = rating;
    setRating(stars); // show the new stars right away
    setState({ status: "saving" });
    try {
      const result = await rateDish(dish.id, stars);
      setState({ status: "saved", liked: result.liked });
    } catch (err) {
      setRating(previous); // put the old stars back if saving failed
      setState({ status: "error", message: err instanceof Error ? err.message : "Couldn't save your rating." });
    }
  }

  return (
    <article className="flex flex-col gap-2 rounded-xl border border-secondary/15 bg-white p-4 text-left">
      <span className="w-fit rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">{dish.section}</span>
      <h3 className="font-heading text-lg text-error">{dish.name}</h3>
      <p className="text-sm text-error/80">{dish.description}</p>
      <p className="border-t border-secondary/10 pt-2 text-xs text-secondary">
        <span className="font-medium">Why for you: </span>
        {dish.reason}
      </p>

      <div className="mt-auto border-t border-secondary/10 pt-2">
        <p className="mb-1 text-xs text-secondary">{rating ? "Your rating" : "Tried it? Rate it"}</p>
        <StarRating
          value={rating}
          onChange={handleRate}
          disabled={state.status === "saving"}
          label={`Rate ${dish.name}`}
        />
        <p aria-live="polite" className="mt-1 min-h-4 text-xs text-secondary">
          {state.status === "saving" && "Saving…"}
          {state.status === "saved" &&
            (state.liked
              ? "Saved to your liked dishes."
              : `Saved to your disliked dishes (${LIKED_MIN_RATING}+ stars counts as liked).`)}
          {state.status === "error" && <span className="text-error">{state.message}</span>}
        </p>
      </div>
    </article>
  );
}
