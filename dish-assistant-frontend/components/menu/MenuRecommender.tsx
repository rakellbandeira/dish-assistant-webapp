"use client";

import { useState } from "react";
import Link from "next/link";
import MenuInputForm from "@/components/menu/MenuInputForm";
import RecommendationResults, { RecommendationSkeleton } from "@/components/recommendations/RecommendationResults";
import FieldError from "@/components/preferences/FieldError";
import { ApiError } from "@/lib/api";
import { getRecommendation, Recommendation, RecommendationRequest } from "@/lib/recommendations";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; signInNeeded: boolean }
  | { status: "done"; recommendation: Recommendation };

/** Menu form + results: the main feature of the home page. */
export default function MenuRecommender() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function handleSubmit(request: RecommendationRequest) {
    setState({ status: "loading" });
    try {
      setState({ status: "done", recommendation: await getRecommendation(request) });
    } catch (err) {
      const signInNeeded = err instanceof ApiError && err.status === 401;
      setState({
        status: "error",
        signInNeeded,
        message: signInNeeded
          ? "Please sign in to get recommendations based on your tastes."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <MenuInputForm isLoading={state.status === "loading"} onSubmit={handleSubmit} />

      {state.status === "loading" && <RecommendationSkeleton />}

      {state.status === "error" && (
        <div className="flex w-full max-w-xl flex-col items-center gap-3">
          <FieldError>{state.message}</FieldError>
          {state.signInNeeded && (
            <Link href="/login" className="text-sm font-medium text-primary">
              Go to sign in
            </Link>
          )}
        </div>
      )}

      {state.status === "done" && (
        <RecommendationResults
          recommendation={state.recommendation}
          onClear={() => setState({ status: "idle" })}
        />
      )}
    </div>
  );
}
