"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboarded } from "@/lib/orders";

const PUBLIC_PATHS = new Set(["/welcome"]);

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const onboarded = useOnboarded();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.has(pathname);

  // Defer redirect decisions until after first client commit. Otherwise the
  // SSR snapshot (always `false`) races with the localStorage read and can
  // bounce already-onboarded users to /welcome during hydration.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const blocked = ready && !onboarded && !isPublic;

  useEffect(() => {
    if (!blocked) return;
    router.replace("/welcome");
  }, [blocked, router]);

  if (blocked) return null;
  return <>{children}</>;
}
