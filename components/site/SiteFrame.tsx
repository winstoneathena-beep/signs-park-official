"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

const STANDALONE_PATHS = new Set(["/welcome"]);

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone = STANDALONE_PATHS.has(pathname);

  if (standalone) return <main className="flex-1">{children}</main>;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
