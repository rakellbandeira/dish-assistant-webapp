import { Check } from "lucide-react";

type StepIndicatorProps = {
  steps: readonly { id: string; title: string }[];
  current: number;
  maxVisited: number;
  onStepClick: (index: number) => void;
};

export default function StepIndicator({ steps, current, maxVisited, onStepClick }: StepIndicatorProps) {
  return (
    <nav aria-label="Preference steps" className="mb-8">
      <p className="mb-2 text-sm text-secondary sm:hidden">
        Step {current + 1} of {steps.length} · {steps[current].title}
      </p>

      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current + 1}
        className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/15"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 hidden sm:flex">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.id} className="flex flex-1 justify-center">
              <button
                type="button"
                disabled={i > maxVisited}
                onClick={() => onStepClick(i)}
                aria-current={active ? "step" : undefined}
                className="flex flex-col items-center gap-1.5 rounded-md px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary text-neutral"
                      : done
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-secondary/25 bg-white text-secondary/60"
                  }`}
                >
                  {done ? <Check size={16} /> : i + 1}
                </span>
                <span className={`text-xs ${active ? "font-medium text-error" : "text-secondary"}`}>{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
