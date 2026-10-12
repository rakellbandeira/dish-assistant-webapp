"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, CircleUserRound, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function SiteHeader() {
  const { user, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-secondary/15">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="-ml-2 p-2 text-error sm:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" onClick={closeMenu} className="font-heading text-2xl font-semibold text-error">
          Dish assistant
        </Link>

        <div className="flex min-h-9 items-center gap-3 font-body text-sm">
          {isLoading ? null : user ? (
            <>
              
              <Link
                href="/profile"
                aria-label="Your profile"
                onClick={closeMenu}
                className="flex items-center gap-2 text-secondary hover:text-primary"
              >
                <CircleUserRound size={24} />
                <span className="max-w-[7rem] truncate sm:max-w-[10rem] sm:pr-6">{user.username}</span>
              </Link>
              
              <button
                type="button"
                onClick={logout}
                className="hidden items-center gap-1.5 text-secondary hover:text-primary sm:flex"
              >
                <LogOut size={16} />
                Log out
              </button>
            </>
          ) : (
            
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/login" className="text-secondary hover:text-primary">
                Sign in
              </Link>
              <Link href="/register">
                <Button variant="primary" className="!h-9">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      
      {menuOpen && !isLoading && (
        <nav
          id="mobile-menu"
          className="flex flex-col gap-1 border-t border-secondary/15 px-4 py-3 font-body text-sm sm:hidden"
        >
          {user ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="flex items-center gap-2 rounded-md px-3 py-3 text-left text-secondary hover:bg-secondary/5 hover:text-primary"
            >
              <LogOut size={16} />
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-md px-3 py-3 text-secondary hover:bg-secondary/5 hover:text-primary"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="rounded-md bg-primary px-3 py-3 text-center font-medium text-neutral hover:bg-secondary"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}