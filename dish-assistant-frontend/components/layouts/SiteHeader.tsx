import Link from "next/link";
import { ReactNode } from "react";
import { Menu, CircleUserRound } from "lucide-react";

type SiteHeaderProps = {
  accountLabel: ReactNode;
};

export default function SiteHeader({ accountLabel }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-secondary/15">
      <button
        type="button"
        aria-label="Open menu"
        className="text-error sm:hidden"
      >
        <Menu size={20} />
      </button>

      <Link href="/" className="font-heading text-lg font-semibold text-error">
        Dish assistant
      </Link>

      <nav className="hidden sm:flex gap-8 text-sm text-secondary font-body">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/recipes">Recipes</Link>
        <Link href="/about">About</Link>
      </nav>

      <div className="flex items-center gap-2 font-body text-sm text-secondary">
        <span className="hidden sm:inline">{accountLabel}</span>
        <CircleUserRound size={26} className="text-secondary" />
      </div>
    </header>
  );
}
