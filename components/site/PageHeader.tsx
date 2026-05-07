import { Reveal } from "@/components/Reveal";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="relative pt-32 md:pt-40 pb-12 md:pb-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {eyebrow && (
          <Reveal>
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-parkwell-blue">
              {eyebrow}
            </span>
          </Reveal>
        )}
        <Reveal delay={0.1}>
          <h1 className="mt-4 text-balance text-[clamp(2.25rem,5vw,4.5rem)] font-bold leading-[1.05] tracking-tight">
            {title}
          </h1>
        </Reveal>
        {description && (
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-3xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
