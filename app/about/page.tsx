import Link from "next/link";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/Reveal";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "About" };

const TEAM = [
  { name: "Joel Christensen", role: "Founder & CEO", initial: "JC" },
  { name: "Michael Miller", role: "President", initial: "MM" },
  { name: "Jon Christensen", role: "EVP, Growth & BizDev", initial: "JC" },
  { name: "Ryan Whitehurst", role: "Operations", initial: "RW" },
  { name: "Andre Gurule", role: "Operations", initial: "AG" },
  { name: "Shannon Snow", role: "Operations", initial: "SS" },
  { name: "Travis Bruce", role: "LA Market Lead", initial: "TB" },
  { name: "Roman Khaimov", role: "Operations", initial: "RK" },
];

const VALUES = [
  { title: "Challenge the status quo", body: "The parking industry is generic. Parkwell isn't." },
  { title: "Serve with integrity", body: "What we promise is what we deliver." },
  { title: "Treat people with dignity", body: "Drivers, clients, teammates — every interaction." },
  { title: "Strive for excellence", body: "Because every touchpoint reinforces the brand." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="People at the center of parking."
        description="Parkwell is a parking management and mobility company headquartered in Denver. We operate at the intersection of operational expertise and modern technology — which is why a tool like this exists in the first place."
      />

      <section className="mx-auto max-w-7xl px-5 md:px-8 py-16">
        <div className="grid gap-12 lg:grid-cols-2 items-start">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Our values</h2>
            <p className="mt-3 text-muted-foreground max-w-md">
              Four principles that guide every decision — including how we show up on a sign.
            </p>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="mx-auto max-w-7xl px-5 md:px-8 py-16">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">The team</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            A lean team of operators across Colorado, California, Utah, and Florida.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {TEAM.map((m, i) => (
            <Reveal key={m.name} delay={i * 0.04}>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <div className="h-12 w-12 rounded-full bg-parkwell-blue/15 text-parkwell-blue flex items-center justify-center font-bold">
                  {m.initial}
                </div>
                <div>
                  <div className="font-semibold text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-5xl px-5 md:px-8 py-16">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Approval workflow</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Every sign passes through three states before it reaches a vendor. The platform tracks the full chain of custody.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            { tag: "01", title: "Creator drafts", body: "Manager picks a template and fills in editable fields. Live preview locks brand elements." },
            { tag: "02", title: "Approver reviews", body: "Senior leadership approves, requests changes with notes, or edits the sign in place." },
            { tag: "03", title: "Vendor receives", body: "Print-ready PDF + spec sheet downloads on approval. Email or print for any vendor." },
          ].map((s, i) => (
            <Reveal key={s.tag} delay={i * 0.08}>
              <div className="rounded-2xl border border-border bg-card p-6 h-full">
                <div className="text-xs font-semibold uppercase tracking-wider text-parkwell-blue">
                  {s.tag}
                </div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center justify-center rounded-full bg-parkwell-blue px-7 text-sm font-semibold text-white hover:bg-parkwell-blue/90 transition-colors"
          >
            Open the dashboard
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
