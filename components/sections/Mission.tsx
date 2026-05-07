import { Reveal } from "@/components/Reveal";

export function Mission() {
  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <Reveal>
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-parkwell-blue">
            Why this exists
          </span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.1] tracking-tight">
            Every sign is a chance to reinforce the Parkwell brand —{" "}
            <span className="text-parkwell-blue">creative, professional, thoughtful.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="mt-7 max-w-3xl text-base sm:text-lg leading-relaxed text-muted-foreground">
            Parkwell managers order hundreds of thousands of dollars of signage each year.
            Without a single source of truth, signs drift off-brand — different fonts, wrong colors,
            abbreviations the guide rules out. This platform replaces the back-and-forth with
            a workflow: a manager picks an approved template, edits only what&rsquo;s editable,
            sends it to leadership, and downloads a vendor-ready file the moment it&rsquo;s approved.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
