"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Pencil } from "lucide-react";
import SiteHeader from "@/components/layouts/SiteHeader";
import RequireAuth from "@/components/auth/RequireAuth";
import Button from "@/components/ui/Button";
import PreferenceWizard from "@/components/preferences/PreferenceWizard";
import PreferenceSummary from "@/components/preferences/PreferenceSummary";
import { Preferences, loadPreferences } from "@/lib/preferences";

type View =
  | { kind: "loading" }
  | { kind: "summary"; prefs: Preferences }
  | { kind: "edit"; prefs: Preferences; startStep: number };

function PreferencesContent() {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
  async function load() {
    const saved = await loadPreferences();

    if (saved) {
      setView({ kind: "summary", prefs: saved });
    } else {
      router.replace("/onboarding");
    }
  }

  load();
  }, [router]);

  function handleSaved(next: Preferences) {
    setJustSaved(true);
    setView({ kind: "summary", prefs: next });
  }

  return (
    <div className="min-h-screen bg-neutral font-body">
      <SiteHeader />

      <main className="mx-auto w-full max-w-2xl px-6 py-10 sm:py-14">
        {view.kind === "loading" && (
          <p className="text-center text-sm text-secondary">Loading your preferences…</p>
        )}

        {view.kind === "summary" && (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl text-error sm:text-4xl">Your preferences</h1>
                <p className="mt-1 text-sm text-secondary">Update anything that has changed since you signed up.</p>
              </div>
              <Button
                onClick={() => {
                  setJustSaved(false);
                  setView({ kind: "edit", prefs: view.prefs, startStep: 0 });
                }}
              >
                <span className="flex items-center gap-2"><Pencil size={14} /> Edit all</span>
              </Button>
            </div>

            {justSaved && (
              <p role="status" className="mb-6 flex items-center gap-2 rounded-md border border-success/50 bg-success/10 px-3 py-2 text-sm text-error">
                <CircleCheck size={16} className="shrink-0" /> Preferences saved.
              </p>
            )}

            <PreferenceSummary
              prefs={view.prefs}
              onEditStep={(i) => {
                setJustSaved(false);
                setView({ kind: "edit", prefs: view.prefs, startStep: i });
              }}
            />
          </>
        )}

        {view.kind === "edit" && (
          <>
            <h1 className="mb-8 text-center font-heading text-3xl text-error sm:text-4xl">Edit your preferences</h1>
            <PreferenceWizard
              initial={view.prefs}
              mode="edit"
              startStep={view.startStep}
              onSaved={handleSaved}
              onCancel={() => setView({ kind: "summary", prefs: view.prefs })}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <RequireAuth>
      <PreferencesContent />
    </RequireAuth>
  );
}
