"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, Pencil } from "lucide-react";
import SiteHeader from "@/components/layouts/SiteHeader";
import Button from "@/components/ui/Button";
import PreferenceWizard from "@/components/preferences/PreferenceWizard";
import PreferenceSummary from "@/components/preferences/PreferenceSummary";
import FieldError from "@/components/preferences/FieldError";
import { ApiError } from "@/lib/api";
import { EMPTY_PREFERENCES, Preferences, loadPreferences } from "@/lib/preferences";
import Breadcrumb from "@/components/layouts/Breadcrumb";

type View =
  | { kind: "loading" }
  | { kind: "error"; message: string; signInNeeded: boolean }
  | { kind: "setup" }
  | { kind: "summary" }
  | { kind: "edit"; startStep: number };

export default function PreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFERENCES);
  const [view, setView] = useState<View>({ kind: "loading" });
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    loadPreferences()
      .then((saved) => {
        if (saved) {
          setPrefs(saved);
          setView({ kind: "summary" });
        } else {
          setView({ kind: "setup" });
        }
      })
      .catch((err) => {
        const signInNeeded = err instanceof ApiError && err.status === 401;
        setView({
          kind: "error",
          signInNeeded,
          message: signInNeeded ? "Please sign in to see your preferences." : err.message,
        });
      });
  }, []);

  function handleSaved(next: Preferences) {
    setPrefs(next);
    setJustSaved(true);
    setView({ kind: "summary" });
  }

  return (
    <div className="min-h-screen bg-neutral font-body">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
        <Breadcrumb current="Preferences" />
        {view.kind === "loading" && <p className="text-center text-sm text-secondary">Loading your preferences…</p>}

        {view.kind === "error" && (
          <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
            <FieldError>{view.message}</FieldError>
            {view.signInNeeded && (
              <Link href="/login" className="text-sm font-medium text-primary">
                Go to sign in
              </Link>
            )}
          </div>
        )}

        {view.kind === "setup" && (
          <>
            <h1 className="mb-8 text-center font-heading text-3xl text-error sm:text-4xl">Tell us your tastes</h1>
            <PreferenceWizard initial={prefs} mode="setup" onSaved={handleSaved} />
          </>
        )}

        {view.kind === "summary" && (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl text-error sm:text-4xl">Your taste profile</h1>
                <p className="mt-1 text-sm text-secondary">Recommendations are tailored to these preferences.</p>
              </div>
              <Button onClick={() => { setJustSaved(false); setView({ kind: "edit", startStep: 0 }); }}>
                <span className="flex items-center gap-2"><Pencil size={14} /> Edit all</span>
              </Button>
            </div>

            {justSaved && (
              <p role="status" className="mb-6 flex items-center gap-2 rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-error">
                <CircleCheck size={16} className="shrink-0" /> Preferences saved.
              </p>
            )}

            <PreferenceSummary
              prefs={prefs}
              onEditStep={(i) => { setJustSaved(false); setView({ kind: "edit", startStep: i }); }}
            />
          </>
        )}

        {view.kind === "edit" && (
          <>
            <h1 className="mb-8 text-center font-heading text-3xl text-error sm:text-4xl">Edit your preferences</h1>
            <PreferenceWizard
              initial={prefs}
              mode="edit"
              startStep={view.startStep}
              onSaved={handleSaved}
              onCancel={() => setView({ kind: "summary" })}
            />
          </>
        )}
      </main>
    </div>
  );
}
