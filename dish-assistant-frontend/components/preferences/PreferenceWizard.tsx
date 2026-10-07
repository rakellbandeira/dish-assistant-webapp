"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import CheckboxGroup from "@/components/preferences/CheckboxGroup";
import MultiSelectDropdown from "@/components/preferences/MultiSelectDropdown";
import AllergyInput from "@/components/preferences/AllergyInput";
import TriedDishesEditor from "@/components/preferences/TriedDishesEditor";
import PreferenceSummary from "@/components/preferences/PreferenceSummary";
import StepIndicator from "@/components/preferences/StepIndicator";
import FieldError from "@/components/preferences/FieldError";
import {
  CUISINES,
  DIETARY,
  FLAVORS,
  FOODS,
  Preferences,
  STEPS,
  StepErrors,
  cleanPreferences,
  firstInvalidStep,
  savePreferences,
  validateStep,
} from "@/lib/preferences";

type PreferenceWizardProps = {
  initial: Preferences;
  mode: "setup" | "edit";
  startStep?: number;
  onSaved: (prefs: Preferences) => void;
  onCancel?: () => void;
};

export default function PreferenceWizard({ initial, mode, startStep = 0, onSaved, onCancel }: PreferenceWizardProps) {
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [step, setStep] = useState(startStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [maxVisited, setMaxVisited] = useState(mode === "edit" ? STEPS.length - 1 : startStep);
  const [errors, setErrors] = useState<StepErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const current = STEPS[step];
  const isReview = current.id === "review";

  function update(patch: Partial<Preferences>) {
    setPrefs((p) => ({ ...p, ...patch }));
    setErrors({});
  }

  function goTo(index: number) {
    setDirection(index < step ? "back" : "forward");
    setStep(index);
    setErrors({});
    setMaxVisited((m) => Math.max(m, index));
  }

  function tryGoTo(index: number) {
    if (index === step) return;
    if (index > step) {
      const found = validateStep(current.id, prefs);
      if (Object.keys(found).length) {
        setErrors(found);
        return;
      }
      setPrefs((p) => cleanPreferences(p));
    }
    goTo(index);
  }

  async function save() {
    const bad = firstInvalidStep(prefs);
    if (bad !== -1) {
      const found = validateStep(STEPS[bad].id, prefs);
      goTo(bad);
      setErrors(found);
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const cleaned = cleanPreferences(prefs);
      await savePreferences(cleaned);
      onSaved(cleaned);
    } catch (err) {
      // Show the backend's message (e.g. "Not authenticated.") when there is one
      setSaveError(err instanceof Error ? err.message : "We couldn't save your preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isReview) save();
    else tryGoTo(step + 1);
  }

  function renderStep() {
    switch (current.id) {
      case "likes":
        return (
          <>
            <CheckboxGroup legend="Flavors you love" options={FLAVORS} selected={prefs.likedFlavors} onChange={(v) => update({ likedFlavors: v })} />
            <CheckboxGroup legend="Foods you love" options={FOODS} selected={prefs.likedFoods} onChange={(v) => update({ likedFoods: v })} />
            <FieldError>{errors.likes}</FieldError>
          </>
        );
      case "dislikes":
        return (
          <>
            <CheckboxGroup legend="Flavors you avoid" options={FLAVORS} selected={prefs.dislikedFlavors} onChange={(v) => update({ dislikedFlavors: v })} />
            <CheckboxGroup legend="Foods you avoid" options={FOODS} selected={prefs.dislikedFoods} onChange={(v) => update({ dislikedFoods: v })} />
            <FieldError>{errors.dislikes}</FieldError>
          </>
        );
      case "cuisines":
        return (
          <>
            <CheckboxGroup legend="Cuisines you enjoy" options={CUISINES} selected={prefs.cuisines} onChange={(v) => update({ cuisines: v })} />
            <FieldError>{errors.cuisines}</FieldError>
          </>
        );
      case "diet":
        return (
          <>
            <MultiSelectDropdown label="Dietary restrictions" hint="Optional. Choose any that apply." options={DIETARY} selected={prefs.dietary} onChange={(v) => update({ dietary: v })} />
            <AllergyInput values={prefs.allergies} onChange={(v) => update({ allergies: v })} />
          </>
        );
      case "tried":
        return (
          <TriedDishesEditor
            dishes={prefs.triedDishes}
            errors={errors}
            onChange={(v) => {
              setPrefs((p) => ({ ...p, triedDishes: v }));
              setErrors({});
            }}
          />
        );
      case "review":
        return <PreferenceSummary prefs={prefs} onEditStep={goTo} />;
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepIndicator steps={STEPS} current={step} maxVisited={maxVisited} onStepClick={tryGoTo} />

      <div key={step} className={direction === "forward" ? "step-enter-forward" : "step-enter-back"}>
        <h2 ref={headingRef} tabIndex={-1} className="font-heading text-2xl text-error focus:outline-none sm:text-3xl">
          {current.title}
        </h2>
        <p className="mb-6 mt-1 text-sm text-secondary">{current.description}</p>
        <div className="flex flex-col gap-8">{renderStep()}</div>
      </div>

      {saveError && (
        <div className="mt-6">
          <FieldError>{saveError}</FieldError>
        </div>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-secondary/15 pt-6">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => tryGoTo(step - 1)}>
            <span className="flex items-center gap-2"><ArrowLeft size={16} /> Back</span>
          </Button>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-3">
          {onCancel && (
            <button type="button" onClick={onCancel} className="rounded-md px-2 py-2 text-sm text-secondary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              Cancel
            </button>
          )}
          {mode === "edit" && !isReview && (
            <Button variant="secondary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          )}
          {isReview ? (
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save preferences"}
            </Button>
          ) : (
            <Button type="submit">
              <span className="flex items-center gap-2">Next <ArrowRight size={16} /></span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
