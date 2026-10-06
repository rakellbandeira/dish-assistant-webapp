"use client";

import Link from "next/link";
import { Menu, CircleUserRound, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function SiteHeader() {
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-secondary/15">
      <button type="button" aria-label="Open menu" className="text-error sm:hidden">
        <Menu size={20} />
      </button>

      <Link href="/" className="font-heading text-2xl font-semibold text-error">
        Dish assistant
      </Link>

      <div className="flex min-h-9 items-center gap-3 font-body text-sm">
        {isLoading ? null : user ? ( // nothing while checking, so "Sign in" doesn't flash for signed-in users
          <>
            {/* TODO: point to a profile page once it exists */}
            <Link
              href="/preferences"
              aria-label="Your preferences"
              className="text-secondary hover:text-primary"
            >
              <CircleUserRound size={24} />
            </Link>
            <button
              type="button"
              onClick={logout}
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
