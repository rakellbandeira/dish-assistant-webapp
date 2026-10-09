"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, CircleUserRound, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on an outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

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
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((o) => !o)}
                className="flex text-secondary hover:text-primary"
              >
                <CircleUserRound size={24} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-40 rounded-md border border-secondary/20 bg-white py-1 shadow-sm">
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-error hover:bg-neutral hover:text-primary"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/preferences"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-error hover:bg-neutral hover:text-primary"
                  >
                    Preferences
                  </Link>
                </div>
              )}
            </div>
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