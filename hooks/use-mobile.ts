"use client";

import { useCallback, useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const subscribe = useCallback((cb: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", cb);
    return () => mql.removeEventListener("change", cb);
  }, []);
  return useSyncExternalStore(
    subscribe,
    () => window.innerWidth < MOBILE_BREAKPOINT,
    () => false,
  );
}

type Platform = "mobile" | "tablet" | "desktop";

let cached: Platform | null = null;

function detectPlatform(): Platform {
  if (cached) return cached;
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  cached =
    w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
  return cached;
}

const noop = () => () => {};

export function usePlatform(): Platform {
  return useSyncExternalStore(
    noop,
    detectPlatform,
    () => "desktop",
  );
}
