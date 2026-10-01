"use client";

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import FieldError from "@/components/preferences/FieldError";
import { DishEntry, newId } from "@/lib/preferences";

type TriedDishesEditorProps = {
  dishes: DishEntry[];
  onChange: (next: DishEntry[]) => void;
  errors: Record<string, string>;
};

function StarPicker({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="rounded p-0.5 text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Star size={20} fill={n <= value ? "currentColor" : "none"} className={n <= value ? "" : "text-secondary/40"} />
        </button>
      ))}
    </div>
  );
}

export default function TriedDishesEditor({ dishes, onChange, errors }: TriedDishesEditorProps) {
  const [focusId, setFocusId] = useState<string | null>(null);

  function add() {
    const id = newId();
    setFocusId(id);
    onChange([...dishes, { id, name: "", rating: 0 }]);
  }

  function patch(id: string, changes: Partial<DishEntry>) {
    onChange(dishes.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }

  return (
    <div className="flex flex-col gap-3">
      {dishes.length === 0 && (
        <p className="rounded-md border border-dashed border-secondary/30 bg-white px-4 py-6 text-center text-sm text-secondary">
          No dishes yet. Add a few you&apos;ve tried so recommendations can learn from your taste.
        </p>
      )}

      {dishes.map((d, i) => {
        const error = errors[`dish:${d.id}`];
        return (
          <div key={d.id} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-secondary/15 bg-white p-3">
              <input
                type="text"
                aria-label={`Dish ${i + 1} name`}
                aria-invalid={Boolean(error)}
                autoFocus={d.id === focusId}
                value={d.name}
                placeholder="Dish name"
                maxLength={80}
                onChange={(e) => patch(d.id, { name: e.target.value })}
                className={`h-10 min-w-40 flex-1 rounded-md border px-3 text-sm text-error transition-colors placeholder:text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  error ? "border-error" : "border-error/30"
                }`}
              />
              <StarPicker
                label={`Rating for dish ${i + 1}`}
                value={d.rating}
                onChange={(rating) => patch(d.id, { rating })}
              />
              <button
                type="button"
                aria-label={`Remove dish ${i + 1}`}
                onClick={() => onChange(dishes.filter((x) => x.id !== d.id))}
                className="rounded-md p-2 text-secondary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <FieldError>{error}</FieldError>
          </div>
        );
      })}

      <div>
        <Button variant="secondary" onClick={add}>
          <span className="flex items-center gap-2">
            <Plus size={16} /> Add a dish
          </span>
        </Button>
      </div>
    </div>
  );
}
