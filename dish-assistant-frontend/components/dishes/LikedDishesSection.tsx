"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getLikedDishes, LikedDish } from "@/lib/dishes";
import { DISH_RATED_EVENT } from "@/lib/feedback";

type State =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "error" }
  | { status: "ready"; dishes: LikedDish[] };

// Three cards visible at a time (like the original "More ideas" row); more scroll sideways
const cardWidth = "w-[calc((100%-2rem)/3)] min-w-[200px] shrink-0 snap-start";

/** "Dishes you previously liked": always shown below the menu form and results. */
export default function LikedDishesSection() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    function load() {
      getLikedDishes()
        .then((dishes) => setState({ status: "ready", dishes }))
        .catch((err) =>
          setState({ status: err instanceof ApiError && err.status === 401 ? "signedOut" : "error" })
        );
    }
    load();
    // Reload when a recommended dish gets rated, so newly liked dishes show up right away
    window.addEventListener(DISH_RATED_EVENT, load);
    return () => window.removeEventListener(DISH_RATED_EVENT, load);
  }, []);

  return (
    <section className="w-full max-w-3xl border-t border-secondary/15 pt-8">
      <h2 className="mb-4 font-heading text-lg text-error">Dishes you previously liked</h2>

      {state.status === "loading" && (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${cardWidth} h-44 animate-pulse rounded-xl bg-secondary/10`} />
          ))}
        </div>
      )}

      {state.status === "signedOut" && (
        <p className="text-sm text-secondary">
          <Link href="/login" className="font-medium text-primary">Sign in</Link> to see the dishes you&apos;ve liked.
        </p>
      )}

      {state.status === "error" && (
        <p className="text-sm text-secondary">We couldn&apos;t load your liked dishes right now.</p>
      )}

      {state.status === "ready" && state.dishes.length === 0 && (
        <p className="text-sm text-secondary">
          Nothing here yet. Rate dishes you&apos;ve tried in your{" "}
          <Link href="/preferences" className="font-medium text-primary">preferences</Link>, or like the dishes we
          recommend, and they&apos;ll show up here.
        </p>
      )}

      {state.status === "ready" && state.dishes.length > 0 && (
        <ul className="flex snap-x gap-4 overflow-x-auto pb-2">
          {state.dishes.map((dish) => (
            <li key={dish.name} className={cardWidth}>
              <LikedDishCard dish={dish} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LikedDishCard({ dish }: { dish: LikedDish }) {
  const meta =
    dish.source === "rating"
      ? `You rated it ${dish.rating}/5`
      : [dish.section, "Liked recommendation"].filter(Boolean).join(" · ");

  return (
    <div className="flex h-full flex-col rounded-xl border border-secondary/15 bg-white p-4 text-left">
      <div className="mb-3 h-20 rounded-lg bg-secondary/80" />
      <p className="font-heading text-sm text-error">{dish.name}</p>
      <p className="mt-1 text-xs text-secondary">{meta}</p>
      <div className="mt-auto flex items-center justify-between pt-3 text-secondary">
        <Heart size={16} aria-label="Liked" className="fill-current text-primary" />
        <button
          type="button"
          // TODO: link to the recommendation history page once it exists (e.g. router.push("/history"))
          onClick={() => window.alert("The history page is coming soon.")}
          className="text-xs font-medium hover:text-primary"
        >
          See more
        </button>
      </div>
    </div>
  );
}
