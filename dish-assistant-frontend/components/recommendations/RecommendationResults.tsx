import Button from "@/components/ui/Button";
import DishCard from "@/components/ui/DishCard";
import { Recommendation, RecommendedDish } from "@/lib/recommendations";

type RecommendationResultsProps = {
  recommendation: Recommendation;
  onClear: () => void; // hide the results to free up space
};

export default function RecommendationResults({ recommendation, onClear }: RecommendationResultsProps) {
  const { summary, familiarDishes, newDishes } = recommendation;
  const nothingFound = familiarDishes.length === 0 && newDishes.length === 0;

  return (
    <section aria-live="polite" className="flex w-full max-w-3xl flex-col gap-10">
      <p className="rounded-xl border border-secondary/15 bg-white p-5 text-base text-error">{summary}</p>

      {!nothingFound && (
        <>
          <DishSection
            title="Familiar picks"
            subtitle="Close to what you already love."
            dishes={familiarDishes}
            emptyText="No familiar matches on this menu, so try the new ones below."
          />
          <DishSection
            title="New to try"
            subtitle="A step outside your comfort zone, with something you'll recognize."
            dishes={newDishes}
            emptyText="No new suggestions this time."
          />
          <p className="text-center text-xs text-secondary">
            Recommendations are AI-generated. Always confirm ingredients and allergens with the restaurant staff.
          </p>
        </>
      )}

      <div className="flex justify-center">
        <Button variant="secondary" onClick={onClear}>
          Clear suggestions
        </Button>
      </div>
    </section>
  );
}

function DishSection({
  title,
  subtitle,
  dishes,
  emptyText,
}: {
  title: string;
  subtitle: string;
  dishes: RecommendedDish[];
  emptyText: string;
}) {
  return (
    <div>
      <h2 className="font-heading text-2xl text-error">{title}</h2>
      <p className="mb-4 text-sm text-secondary">{subtitle}</p>
      {dishes.length === 0 ? (
        <p className="text-sm text-secondary">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div role="status" className="flex w-full max-w-3xl flex-col gap-6">
      <p className="text-center text-sm text-secondary">
        Reading the menu and matching it to your tastes. This can take up to 30 seconds…
      </p>
      <div className="h-20 animate-pulse rounded-xl bg-secondary/10" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-xl bg-secondary/10" />
        ))}
      </div>
    </div>
  );
}
