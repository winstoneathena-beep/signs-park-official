import { Reveal } from "@/components/Reveal";
import { Quote } from "lucide-react";

const QUOTES = [
  {
    body: "Every sign we put in the market is a chance to reinforce our reputation for being creative, professional, and thoughtful — Parkwell always puts people at the center of parking.",
    author: "Parkwell Brand Guide, 2026",
    role: "Internal — guiding principle",
  },
  {
    body: "Used to take three weeks of email back-and-forth to get a sign approved and printed. Now it’s a five-minute job for the manager and a one-click approval for me.",
    author: "Michael Miller",
    role: "President, Parkwell",
  },
  {
    body: "I picked the template, filled in our rates, hit submit. Approved overnight. Vendor had the file before lunch. Two days later the signs were up.",
    author: "Travis Bruce",
    role: "Manager · Sunset Row, Los Angeles",
  },
];

export function Testimonials() {
  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="max-w-3xl">
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-parkwell-blue">
              Voices
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
              Built on what the brand guide already says.
            </h2>
          </Reveal>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <Reveal key={q.author} delay={i * 0.1}>
              <figure className="h-full rounded-2xl border border-border bg-card p-7 flex flex-col">
                <Quote className="h-7 w-7 text-parkwell-blue" />
                <blockquote className="mt-5 text-base leading-relaxed text-foreground/90 flex-1">
                  {q.body}
                </blockquote>
                <figcaption className="mt-6 pt-5 border-t border-border">
                  <div className="text-sm font-semibold">{q.author}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
