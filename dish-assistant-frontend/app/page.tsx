import { Search } from "lucide-react";
import SiteHeader from "@/components/layouts/SiteHeader";
import SiteFooter from "@/components/layouts/SiteFooter";
import DishCard from "@/components/ui/DishCard";
import Button from "@/components/ui/Button";

const results = [
  { name: "Garlic butter chicken", meta: "25 min · 4 ingredients" },
  { name: "Spinach and white bean stew", meta: "30 min · 6 ingredients" },
  { name: "Skillet chicken and greens", meta: "20 min · 5 ingredients" },
];

const moreIdeas = [
  { name: "Lemon herb salmon", meta: "20 min · 5 ingredients" },
  { name: "Roasted veggie grain bowl", meta: "35 min · 7 ingredients" },
  { name: "One-pan sausage and peppers", meta: "25 min · 5 ingredients" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral font-body">
      <SiteHeader accountLabel="Sign in" />

      <main className="flex flex-1 flex-col items-center px-8 py-16 sm:py-20">
        <h1 className="max-w-lg text-center font-heading text-4xl font-semibold leading-tight text-error sm:text-5xl">
          What should I cook tonight?
        </h1>
        <p className="mt-4 max-w-md text-center text-base text-secondary">
          Tell me what&apos;s in your fridge and I&apos;ll suggest something
          worth making.
        </p>

        <form className="mt-8 flex w-full max-w-md items-center gap-2">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-md border border-error/30 bg-white px-4">
            <Search size={16} className="text-secondary" />
            <input
              type="text"
              placeholder="chicken thighs, spinach, garlic..."
              className="w-full text-sm text-error placeholder:text-secondary/50 focus:outline-none"
            />
          </div>
          <Button type="submit" className="!h-11">
            Suggest
          </Button>
        </form>

        <section className="mt-14 w-full max-w-3xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {results.map((dish) => (
              <DishCard key={dish.name} {...dish} />
            ))}
          </div>
        </section>

        <section className="mt-10 w-full max-w-3xl border-t border-secondary/15 pt-8">
          <h2 className="mb-4 font-heading text-lg text-error">More ideas for you</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {moreIdeas.map((dish) => (
              <DishCard key={dish.name} {...dish} />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
