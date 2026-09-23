"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import SiteHeader from "@/components/layouts/SiteHeader";
import AuthInput from "@/components/auth/AuthInput";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { isValidEmail, getPasswordStrength } from "@/lib/validation";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const errors: FieldErrors = {};

    if (!email.trim()) errors.email = "Email is required.";
    else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

    if (!password) {
      errors.password = "Password is required.";
    } else if (getPasswordStrength(password).score < 2) {
      errors.password = "Choose a stronger password (8+ characters, mix of letters/numbers).";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords don't match.";
    }

    if (!acceptedTerms) {
      errors.terms = "You need to accept the terms to continue.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // TODO: replace with the real registration endpoint, e.g.:
      // const res = await fetch("/api/auth/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email, password }),
      // });
      // if (!res.ok) throw new Error((await res.json()).message);

      await new Promise((resolve) => setTimeout(resolve, 1200)); // placeholder

      // TODO: redirect to onboarding/dashboard on success
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Something went wrong creating your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral font-body">
      <SiteHeader isLoggedIn={false} />

      <section className="flex flex-col items-center px-6 py-12 sm:py-16 md:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl text-error mb-2 text-center">
          Create your account
        </h1>
        <p className="text-secondary text-sm mb-8 sm:mb-10 text-center max-w-sm">
          Set up your profile so recommendations can start learning what you like.
        </p>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-sm flex flex-col gap-4"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-md border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
            >
              {formError}
            </div>
          )}

          <AuthInput
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoComplete="email"
          />

          <div className="flex flex-col gap-2">
            <AuthInput
              label="Password"
              type="password"
              name="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={password} />
          </div>

          <AuthInput
            label="Confirm password"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          <Checkbox
            id="accept-terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            error={fieldErrors.terms}
            label={
              <>
                I agree to the{" "}
                <Link href="/terms" className="text-primary font-medium">
                  Terms &amp; Conditions
                </Link>{" "}
                and consent to my ingredient and preference data being used to
                generate AI recommendations.
              </>
            }
          />

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-secondary mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
