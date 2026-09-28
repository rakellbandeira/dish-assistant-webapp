"use client";

import { KeyboardEvent, useId, useState } from "react";
import { X } from "lucide-react";

type AllergyInputProps = {
  values: string[];
  onChange: (next: string[]) => void;
};

export default function AllergyInput({ values, onChange }: AllergyInputProps) {
  const [draft, setDraft] = useState("");
  const id = useId();

  function commit() {
    const items = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (items.length) {
      const next = [...values];
      for (const item of items) {
        if (!next.some((v) => v.toLowerCase() === item.toLowerCase())) next.push(item.slice(0, 40));
      }
      onChange(next);
    }
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div>
      <label htmlFor={id} className="font-heading text-lg text-error">Allergies</label>
      <p className="text-sm text-secondary">Type an allergy and press Enter, e.g. peanuts, shellfish.</p>
      <input
        id={id}
        type="text"
        value={draft}
        placeholder="Add an allergy"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        maxLength={80}
        className="mt-2 h-10 w-full rounded-md border border-error/30 bg-white px-3 text-sm text-error transition-colors placeholder:text-secondary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {values.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map((v) => (
            <li key={v} className="flex items-center gap-1 rounded-full border border-error/30 bg-error/5 py-1 pl-3 pr-1.5 text-sm text-error">
              {v}
              <button
                type="button"
                aria-label={`Remove ${v}`}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="rounded-full p-0.5 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
