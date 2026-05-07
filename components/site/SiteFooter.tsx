"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { usePlatform } from "@/hooks/use-mobile";
import { Smartphone, Tablet, Monitor } from "lucide-react";

export function SiteFooter() {
  const platform = usePlatform();
  const Icon =
    platform === "mobile"
      ? Smartphone
      : platform === "tablet"
        ? Tablet
        : Monitor;
  const platformLabel =
    platform === "mobile"
      ? "Mobile"
      : platform === "tablet"
        ? "Tablet"
        : "Desktop";

  return (
    <footer className="relative mt-24 bg-ink text-white overflow-hidden">
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute -top-px inset-x-0 w-full h-16 -translate-y-[97%]"
        aria-hidden
      >
        <path
          d="M432.152 0C149.61 0 0 33 0 33L0 120 1440 120 1440 0C1440 0 1229.23 28.5 1002.29 28.5 775.346 28.5 714.693 0 432.152 0Z"
          fill="#0A202E"
        />
      </svg>

      <div className="relative mx-auto max-w-7xl px-5 md:px-8 pt-16 pb-10">
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <Logo tone="white" className="w-40" />
            <p className="mt-5 text-sm leading-relaxed text-white/70 max-w-sm">
              The Parkwell signage platform. Pick from approved templates, customize within brand standards, and ship vendor-ready files in minutes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="https://goparkwell.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-full bg-parkwell-blue px-6 text-sm font-semibold text-white hover:bg-parkwell-blue/90 transition-colors"
              >
                Sign up at goparkwell.com
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Talk to the team
              </Link>
            </div>
          </div>

          <FooterCol
            title="Platform"
            items={[
              { label: "Sign Library", href: "/templates" },
              { label: "Create a Sign", href: "/create" },
              { label: "Dashboard", href: "/dashboard" },
              { label: "Order History", href: "/dashboard/orders" },
            ]}
          />
          <FooterCol
            title="About"
            items={[
              { label: "Brand standards", href: "/brand" },
              { label: "How it works", href: "/#how-it-works" },
              { label: "Team", href: "/about" },
              { label: "Recent launches", href: "/#launches" },
            ]}
          />
          <FooterCol
            title="Resources"
            items={[
              { label: "FAQ", href: "/#faq" },
              { label: "Vendor specs", href: "/vendor-specs" },
              { label: "Approval workflow", href: "/about#workflow" },
              { label: "Contact", href: "/contact" },
            ]}
          />
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-xs text-white/55">
          <div>© {new Date().getFullYear()} Parkwell, LLC. All rights reserved.</div>
          <div className="inline-flex items-center gap-2">
            <Icon className="h-3.5 w-3.5" />
            <span>You&rsquo;re viewing on {platformLabel}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/50">
        {title}
      </h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
