"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboarded } from "@/lib/orders";

const PUBLIC_PATHS = new Set(["/welcome"]);

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const onboarded = useOnboarded();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.has(pathname);
  const blocked = !onboarded && !isPublic;

  useEffect(() => {
    if (!blocked) return;
    const handle = requestAnimationFrame(() => router.replace("/welcome"));
    return () => cancelAnimationFrame(handle);
  }, [blocked, router]);

  if (blocked) return null;
  return <>{children}</>;
}
