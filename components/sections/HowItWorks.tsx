import { Reveal } from "@/components/Reveal";
import {
  LayoutTemplate,
  Pencil,
  ShieldCheck,
  Download,
} from "lucide-react";

const STEPS = [
  {
    icon: LayoutTemplate,
    title: "Pick from 12 approved templates",
    body:
      "Every sign type from the Parkwell brand guide — Scan to Pay, Standard Rate, Valet, Directional, Reserved, Liability — already drawn at print resolution.",
  },
  {
    icon: Pencil,
    title: "Edit only what the brand allows",
    body:
      "Fill in location, rates, additional copy. Colors, fonts, the wave + logo — locked. No abbreviations, no off-brand fonts. The path of least resistance is on-brand.",
  },
  {
    icon: ShieldCheck,
    title: "Send to leadership for sign-off",
    body:
      "Approver gets the preview and full specs. They can approve, request changes with notes, or jump in and edit the sign themselves before clearing it.",
  },
  {
    icon: Download,
    title: "Download a vendor-ready file",
    body:
      "Print-ready PDF + spec sheet (dimensions, material, quantity) downloads instantly. Hand it to any vendor — even the low-tech ones who only take email attachments.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-muted/40 dark:bg-card/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="max-w-3xl">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-parkwell-blue">
              How it works
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
              From idea to vendor-ready file in four steps.
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 hover:border-parkwell-blue/40 transition-colors">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-parkwell-blue/10 text-parkwell-blue">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="mt-2 text-lg font-semibold leading-snug">{s.title}</h3>
                <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
