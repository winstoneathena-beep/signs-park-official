"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/welcome"]);

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_PATHS.has(pathname);
  const blocked = auth.status === "signed-out" && !isPublic;

  useEffect(() => {
    if (!blocked) return;
    router.replace("/welcome");
  }, [blocked, router]);

  // Hold private pages until the Supabase session hydrates ("loading" is
  // one localStorage read — a frame or two). Rendering them optimistically
  // would flash signed-in chrome at signed-out visitors before the
  // redirect above lands.
  if (!isPublic && auth.status !== "signed-in") return null;
  return <>{children}</>;
}
