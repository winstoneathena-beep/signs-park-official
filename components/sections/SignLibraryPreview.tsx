import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SIGN_TEMPLATES } from "@/lib/sign-templates";

export function SignLibraryPreview() {
  // Show a curated 6 from across categories
  const ids = [
    "standard-rate",
    "scan-to-pay-standard",
    "directional-windmaster",
    "valet-podium-rate",
    "reserved-24-7",
    "enforcement-warning",
  ];
  const templates = ids
    .map((id) => SIGN_TEMPLATES.find((t) => t.id === id))
    .filter(Boolean) as typeof SIGN_TEMPLATES;

  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <Reveal>
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-parkwell-blue">
                Sign library
              </span>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
                Twelve templates. Every Parkwell scenario.
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground">
                Drawn at print resolution, straight from the brand guide. Pick a category to get started.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.3}>
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-parkwell-blue hover:underline"
            >
              See all templates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.06}>
              <Link
                href={`/create?template=${t.id}`}
                className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-parkwell-blue/40 hover:shadow-lg transition-all"
              >
                <div className="relative aspect-[4/5] bg-muted overflow-hidden">
                  <Image
                    src={t.sourceImage}
                    alt={t.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-6 group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div className="p-5 border-t border-border">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sign #{t.number}
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold">{t.name}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
