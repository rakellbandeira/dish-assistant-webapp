import { ReactNode } from "react";
import { Pencil, Star } from "lucide-react";
import { Preferences, StepId, stepIndex } from "@/lib/preferences";

type PreferenceSummaryProps = {
  prefs: Preferences;
  onEditStep?: (stepIndex: number) => void;
};

function Section({
  title,
  step,
  onEditStep,
  children,
}: {
  title: string;
  step: StepId;
  onEditStep?: (i: number) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-secondary/15 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-lg text-error">{title}</h3>
        {onEditStep && (
          <button
            type="button"
            onClick={() => onEditStep(stepIndex(step))}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-secondary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Pencil size={14} /> Edit<span className="sr-only"> {title}</span>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Group({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-secondary/70">{label}</p>
      {items.length ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((i) => (
            <li key={i} className="rounded-full bg-secondary/10 px-3 py-1 text-sm text-secondary">{i}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-secondary/60">None added</p>
      )}
    </div>
  );
}

export default function PreferenceSummary({ prefs, onEditStep }: PreferenceSummaryProps) {
  return (
    <div className="flex flex-col gap-4 text-left">
      <Section title="Likes" step="likes" onEditStep={onEditStep}>
        <Group label="Flavors" items={prefs.likedFlavors} />
        <Group label="Foods" items={prefs.likedFoods} />
      </Section>

      <Section title="Dislikes" step="dislikes" onEditStep={onEditStep}>
        <Group label="Flavors" items={prefs.dislikedFlavors} />
        <Group label="Foods" items={prefs.dislikedFoods} />
      </Section>

      <Section title="Cuisines" step="cuisines" onEditStep={onEditStep}>
        <Group label="Preferred" items={prefs.cuisines} />
      </Section>

      <Section title="Diet & allergies" step="diet" onEditStep={onEditStep}>
        <Group label="Dietary restrictions" items={prefs.dietary} />
        <Group label="Allergies" items={prefs.allergies} />
      </Section>

      <Section title="Dishes tried" step="tried" onEditStep={onEditStep}>
        {prefs.triedDishes.length ? (
          <ul className="flex flex-col divide-y divide-secondary/10">
            {prefs.triedDishes.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <span className="text-sm text-error">{d.name}</span>
                <span className="flex gap-0.5 text-primary" role="img" aria-label={`${d.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} fill={n <= d.rating ? "currentColor" : "none"} className={n <= d.rating ? "" : "text-secondary/40"} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-secondary/60">None added</p>
        )}
      </Section>
    </div>
  );
}
