import { Check } from "lucide-react";

type CheckboxGroupProps = {
  legend: string;
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
};

export default function CheckboxGroup({ legend, hint, options, selected, onChange }: CheckboxGroupProps) {
  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
  }

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 p-0 font-heading text-lg text-error">{legend}</legend>
      {hint && <p className="mb-2 text-sm text-secondary">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <label key={option} className="cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={on}
                onChange={() => toggle(option)}
              />
              <span
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 ${
                  on
                    ? "border-primary bg-primary text-neutral"
                    : "border-secondary/25 bg-white text-secondary hover:border-primary/60"
                }`}
              >
                {on && <Check size={14} />}
                {option}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
