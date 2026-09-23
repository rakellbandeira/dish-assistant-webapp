import Link from "next/link";
import { Menu, CircleUserRound, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";

type SiteHeaderProps = {
  isLoggedIn?: boolean;
  onLogout?: () => void;
};

export default function SiteHeader({ isLoggedIn = false, onLogout }: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-secondary/15">
      <button type="button" aria-label="Open menu" className="text-error sm:hidden">
        <Menu size={20} />
      </button>

      <Link href="/" className="font-heading text-2xl font-semibold text-error">
        Dish assistant
      </Link>

      <nav className="hidden sm:flex gap-8 text-sm text-secondary font-body">
        <Link href="/how-it-works">How it works</Link>
        <Link href="/recipes">Recipes</Link>
        <Link href="/about">About</Link>
      </nav>

      <div className="flex items-center gap-3 font-body text-sm">
        {isLoggedIn ? (
          <>
            <Link
              href="/profile"
              aria-label="Your profile"
              className="text-secondary hover:text-primary"
            >
              <CircleUserRound size={24} />
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 text-secondary hover:text-primary"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hidden sm:inline text-secondary hover:text-primary">
              Sign in
            </Link>
            <Link href="/register">
              <Button variant="primary" className="!h-9">
                Sign up
              </Button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
