"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

type MultiSelectDropdownProps = {
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

export default function MultiSelectDropdown({
  label,
  hint,
  options,
  selected,
  onChange,
  placeholder = "Select all that apply",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
  }

  return (
    <div ref={rootRef} className="relative">
      <span id={labelId} className="font-heading text-lg text-error">{label}</span>
      {hint && <p className="text-sm text-secondary">{hint}</p>}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        className="mt-2 flex h-10 w-full items-center justify-between rounded-md border border-error/30 bg-white px-3 text-left text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <span className={selected.length ? "text-error" : "text-secondary/60"}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <ChevronDown size={16} className={`text-secondary transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          aria-labelledby={labelId}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-secondary/20 bg-white py-1 shadow-sm"
        >
          {options.map((option) => {
            const on = selected.includes(option);
            return (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(option)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-error hover:bg-neutral focus:bg-neutral focus:outline-none"
                >
                  {option}
                  {on && <Check size={14} className="text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {selected.map((s) => (
            <li key={s} className="flex items-center gap-1 rounded-full bg-secondary/10 py-1 pl-3 pr-1.5 text-sm text-secondary">
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => toggle(s)}
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
