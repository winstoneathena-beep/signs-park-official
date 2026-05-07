import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Calendar } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function SignOfTheMonth() {
  return (
    <section id="launches" className="relative bg-ink text-white py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid-soft opacity-50" aria-hidden />
      <div
        className="absolute -top-32 right-0 w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-60"
        style={{ background: "radial-gradient(circle, #19B2EC55, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <Reveal>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-parkwell-yellow/40 bg-parkwell-yellow/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-parkwell-yellow">
                <Star className="h-3.5 w-3.5 fill-parkwell-yellow" />
                Sign of the month
              </div>
              <h2 className="mt-5 text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
                Sunset Row, Los Angeles
              </h2>
              <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/75 max-w-xl">
                Travis and the LA team launched Sunset Row in October — six rate signs and four
                Scan-to-Pay panels installed on day one. Each one ordered through the platform,
                approved within 48 hours, in vendor hands the same week.
              </p>

              <dl className="mt-8 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <dt className="flex items-center gap-1.5 text-white/55 text-xs uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5" />
                    Location
                  </dt>
                  <dd className="mt-1 font-semibold">Sunset Row · Los Angeles</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 text-white/55 text-xs uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5" />
                    Launched
                  </dt>
                  <dd className="mt-1 font-semibold">October 2025</dd>
                </div>
                <div>
                  <dt className="text-white/55 text-xs uppercase tracking-wider">Manager</dt>
                  <dd className="mt-1 font-semibold">Travis Bruce</dd>
                </div>
                <div>
                  <dt className="text-white/55 text-xs uppercase tracking-wider">Signs delivered</dt>
                  <dd className="mt-1 font-semibold">10 across 3 templates</dd>
                </div>
              </dl>

              <Link
                href="/templates"
                className="mt-9 inline-flex h-11 items-center justify-center rounded-full bg-parkwell-blue px-6 text-sm font-semibold text-white hover:bg-parkwell-blue/90 transition-colors"
              >
                See the templates used
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative">
              <div className="absolute -inset-8 rounded-3xl bg-parkwell-blue/15 blur-3xl" aria-hidden />
              <div className="relative grid grid-cols-3 gap-3">
                <div className="col-span-2 rounded-2xl overflow-hidden bg-white shadow-2xl shadow-black/40 border border-white/10">
                  <Image
                    src="/sign-templates/03-standard-rate.png"
                    alt="Standard Rate Sign"
                    width={600}
                    height={942}
                    className="w-full h-auto"
                  />
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden bg-white shadow-2xl shadow-black/40 border border-white/10">
                    <Image
                      src="/sign-templates/01-scan-to-pay-standard.png"
                      alt="Scan to Pay"
                      width={300}
                      height={450}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="rounded-2xl overflow-hidden bg-white shadow-2xl shadow-black/40 border border-white/10">
                    <Image
                      src="/sign-templates/07-directional-windmaster.png"
                      alt="Directional Windmaster"
                      width={300}
                      height={471}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
