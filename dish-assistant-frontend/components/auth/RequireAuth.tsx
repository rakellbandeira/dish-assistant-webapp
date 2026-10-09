"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/layouts/SiteHeader";
import { useAuth } from "@/context/AuthContext";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral font-body">
        <SiteHeader />
        <p className="px-6 py-14 text-center text-sm text-secondary">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
