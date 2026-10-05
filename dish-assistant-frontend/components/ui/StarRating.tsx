"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type StarRatingProps = {
  value: number; // 0 = not rated yet
  onChange: (rating: number) => void;
  disabled?: boolean;
  label: string; // for screen readers, e.g. "Rate Moqueca Baiana"
};

/** Five clickable stars. Hovering previews the rating before clicking. */
export default function StarRating({ value, onChange, disabled = false, label }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          aria-pressed={value === star}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange(star)}
          className="rounded p-0.5 text-primary transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-wait disabled:opacity-60"
        >
          <Star size={18} className={star <= shown ? "fill-current" : ""} />
        </button>
      ))}
    </div>
  );
}
