"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "Who can use this platform?",
    a: "All Parkwell location managers can create sign orders. Senior leadership (currently Michael Miller and the regional directors) review and approve. Admins have full visibility and can mark orders as 'Ordered' once vendors confirm.",
  },
  {
    q: "Why are most fields locked?",
    a: "The brand guide treats every sign as a touchpoint. Locking colors, fonts, the wave footer and the logo means we can’t accidentally ship a sign in the wrong blue or in a font that isn’t Montserrat. Managers edit only what the guide explicitly leaves editable — location, rates, additional copy.",
  },
  {
    q: "What about vendors that won't take digital files?",
    a: "Every order produces both a print-ready PDF of the sign and a one-page spec sheet (dimensions, material, quantity, brand colors, fonts). You can email or print them for any vendor — no integration required on their end.",
  },
  {
    q: "Can an approver edit the sign instead of just rejecting it?",
    a: "Yes. From the approval queue, an approver can hit 'Edit Sign,' make the change directly, and approve in the same step. Saves a round trip for small fixes.",
  },
  {
    q: "How is order history kept?",
    a: "Every order — drafts, pending, approved, and ordered — lives in a searchable database. Filter by template, location, manager, or date. Click any past order to see the exact sign that shipped, plus full specs.",
  },
  {
    q: "What happens if our brand guide updates?",
    a: "Templates, colors, and fonts are wired to a single source of truth. When the brand guide changes, the platform changes with it — no need to retrain managers or re-approve dozens of templates.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative bg-muted/40 dark:bg-card/30 py-24 md:py-32">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-parkwell-blue">
              FAQ
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
              Common questions, answered.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 divide-y divide-border rounded-2xl border border-border bg-card">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full text-left px-6 md:px-7 py-5 flex items-center justify-between gap-6 hover:bg-muted/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-base md:text-lg font-semibold">{item.q}</span>
                  <span
                    className={cn(
                      "shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                      isOpen
                        ? "bg-parkwell-blue text-white"
                        : "bg-muted text-foreground/70",
                    )}
                  >
                    {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 md:px-7 pb-6 text-sm md:text-base leading-relaxed text-muted-foreground">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
