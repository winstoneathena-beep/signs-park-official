"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";

const ROTATING = ["on-brand", "on-spec", "on-time", "consistent", "audit-ready"];

export function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % ROTATING.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden bg-ink text-white pt-28 md:pt-36 pb-24 md:pb-40">
      {/* Subtle grid + Parkwell-blue ambient glows */}
      <div className="absolute inset-0 bg-grid-soft opacity-60" aria-hidden />
      <div
        className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, #19B2EC55, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, #19B2EC33, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <Link
          href="https://www.linkedin.com/company/goparkwell"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-4 py-1.5 text-xs font-medium text-white/85 hover:bg-white/10 transition-colors"
        >
          <LinkedInIcon size={14} />
          Read the launch article on LinkedIn
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <h1 className="mt-8 text-balance text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.02] tracking-tight">
          Every Parkwell sign,<br className="hidden md:inline" />{" "}
          <span className="relative inline-flex h-[1.1em] overflow-hidden align-middle min-w-[8ch]">
            <span className="invisible">{ROTATING[0]}.</span>
            {ROTATING.map((word, idx) => (
              <motion.span
                key={word}
                className="absolute left-0 right-0 text-parkwell-blue"
                initial={false}
                animate={{
                  y: idx === i ? 0 : idx < i ? "-110%" : "110%",
                  opacity: idx === i ? 1 : 0,
                }}
                transition={{ type: "spring", stiffness: 80, damping: 16 }}
              >
                {word}.
              </motion.span>
            ))}
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base sm:text-lg leading-relaxed text-white/70">
          The internal platform Parkwell managers use to design, approve and order
          signage that always looks like Parkwell. Pick a template. Edit only what
          the brand allows. Download a vendor-ready file in seconds.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/create"
            className="inline-flex h-12 items-center justify-center rounded-full bg-parkwell-blue px-7 text-sm font-semibold text-white shadow-lg shadow-parkwell-blue/40 hover:bg-parkwell-blue/90 transition-colors"
          >
            Create a sign
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
          <Link
            href="/templates"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
          >
            Browse the sign library
          </Link>
        </div>

        {/* Sign artwork strip */}
        <div className="mt-16 md:mt-20 -mx-5 md:-mx-8">
          <div className="flex items-end gap-4 md:gap-6 overflow-x-auto px-5 md:px-8 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
            {[
              { src: "/sign-templates/03-standard-rate.png", h: 320, label: "Standard Rate" },
              { src: "/sign-templates/01-scan-to-pay-standard.png", h: 360, label: "Scan to Pay" },
              { src: "/sign-templates/07-directional-windmaster.png", h: 380, label: "Directional" },
              { src: "/sign-templates/05-marquee-rates.png", h: 320, label: "Marquee" },
              { src: "/sign-templates/11-enforcement-warning.png", h: 340, label: "Enforcement" },
              { src: "/sign-templates/04-valet-podium-rate.png", h: 360, label: "Valet Podium" },
            ].map((sign, idx) => (
              <motion.div
                key={sign.src}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 + idx * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10 snap-start"
                style={{ height: sign.h }}
              >
                <Image
                  src={sign.src}
                  alt={sign.label}
                  width={300}
                  height={sign.h}
                  className="h-full w-auto"
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-14 inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/45">
          <Logo tone="white" className="w-20 opacity-70" />
          <span>Internal · For Parkwell managers</span>
        </div>
      </div>
    </section>
  );
}
