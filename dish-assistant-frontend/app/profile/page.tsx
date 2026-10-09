"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, ShieldAlert } from "lucide-react";
import SiteHeader from "@/components/layouts/SiteHeader";
import RequireAuth from "@/components/auth/RequireAuth";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Preferences, loadPreferences } from "@/lib/preferences";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-neutral px-4 py-3">
      <p className="font-heading text-2xl text-error">{value}</p>
      <p className="text-xs text-secondary">{label}</p>
    </div>
  );
}

function ProfileContent() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Preferences | null | undefined>(undefined);

  useEffect(() => {
    async function load() {
      try {
        const data = await loadPreferences();
        setPrefs(data);
      } catch (error) {
        console.error("Failed to load preferences:", error);
        setPrefs(null);
      }
    }

    load();
  }, []);

  const email = user?.email ?? "";
  const initial = email.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-neutral font-body">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
        <h1 className="mb-8 font-heading text-3xl text-error sm:text-4xl">
          Your profile
        </h1>

        <section className="mb-6 rounded-xl border border-secondary/15 bg-white p-5">
          <h2 className="mb-4 font-heading text-lg text-error">Account</h2>

          <div className="flex items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-xl text-neutral"
            >
              {initial}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-secondary/70">
                Email
              </p>
              <p className="truncate text-sm text-error">{email}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-secondary/15 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg text-error">
              Taste profile
            </h2>

            {prefs && (
              <Link
                href="/preferences/edit"
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-secondary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                View and edit
                <ChevronRight size={14} />
              </Link>
            )}
          </div>

          {prefs === undefined && (
            <p className="text-sm text-secondary">Loading…</p>
          )}

          {prefs === null && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-secondary">
                You haven&apos;t set your preferences yet. Add them so
                recommendations match your taste.
              </p>

              <Link href="/preferences/edit">
                <Button>
                  Set up preferences
                </Button>
              </Link>
            </div>
          )}

          {prefs && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label="Likes"
                  value={
                    prefs.likedFlavors.length + prefs.likedFoods.length
                  }
                />

                <Stat
                  label="Dislikes"
                  value={
                    prefs.dislikedFlavors.length +
                    prefs.dislikedFoods.length
                  }
                />

                <Stat
                  label="Cuisines"
                  value={prefs.cuisines.length}
                />

                <Stat
                  label="Dishes rated"
                  value={prefs.triedDishes.length}
                />
              </div>

              {(prefs.allergies.length > 0 ||
                prefs.dietary.length > 0) && (
                <div className="flex items-start gap-2 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error">
                  <ShieldAlert
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <p>
                    Always avoided:{" "}
                    {[...prefs.allergies, ...prefs.dietary].join(", ")}
                  </p>
                </div>
              )}

              <div className="flex justify-end border-t border-secondary/10 pt-4">
                <Link href="/preferences/edit">
                  <Button>
                    <span className="flex items-center gap-2">
                      <Pencil size={14} />
                      Edit preferences
                    </span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}