"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import SiteHeader from "@/components/layouts/SiteHeader";
import AuthInput from "@/components/auth/AuthInput";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { loginRequest } from "@/lib/auth";

const REMEMBERED_USERNAME_KEY = "dish-assistant:remembered-username";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const remembered = window.localStorage.getItem(REMEMBERED_USERNAME_KEY);
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!username.trim()) errors.username = "Username is required.";
    if (!password) errors.password = "Password is required.";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
            await loginRequest({ username, password, rememberMe });

      if (rememberMe) {
        window.localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
      } else {
        window.localStorage.removeItem(REMEMBERED_USERNAME_KEY);
      }
      
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "That username and password don't match. Try again."
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
          Welcome back
        </h1>
        <p className="text-secondary text-sm mb-8 sm:mb-10 text-center max-w-sm">
          Sign in to pick up your saved preferences and recommendations.
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
            label="Username"
            type="text"
            name="username"
            placeholder="yourusername"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
            autoComplete="username"
          />
          <AuthInput
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between -mt-1">
            <Checkbox
              id="remember-me"
              label="Remember me for 30 days"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <Link href="/forgot-password" className="text-xs text-secondary shrink-0">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="text-sm text-secondary mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-medium">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
