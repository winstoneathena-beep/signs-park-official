import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export function CTA() {
  return (
    <section className="relative bg-background py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-parkwell-blue text-white p-10 md:p-16">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.5), transparent 50%), radial-gradient(circle at 100% 100%, rgba(10,32,46,0.4), transparent 50%)",
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="text-balance text-[clamp(2rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight max-w-2xl">
                Order your next sign in five minutes flat.
              </h2>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-white/85">
                Pick a template. Fill in the editable fields. Download or send for approval.
                That&rsquo;s it.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/create"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white text-parkwell-blue px-7 text-sm font-semibold hover:bg-white/95 transition-colors"
                >
                  Create a sign
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  Open dashboard
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
