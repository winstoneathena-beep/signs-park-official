import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import {
  CATEGORY_LABELS,
  templatesByCategory,
  type SignCategory,
  type SignTemplate,
} from "@/lib/sign-templates";

export const metadata = { title: "Sign Library" };

export default function TemplatesPage() {
  const groups = templatesByCategory();
  const order: SignCategory[] = [
    "rate-sign",
    "scan-to-pay",
    "directional",
    "reserved",
    "informational",
  ];

  return (
    <>
      <PageHeader
        eyebrow="Sign library"
        title="Twelve templates. Every Parkwell scenario."
        description="Drawn at print resolution from the brand guide. Pick one to start a new sign order — or browse to see what's available."
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8 pb-24 space-y-20">
        {order.map((cat) => (
          <section key={cat}>
            <div className="flex items-baseline justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="text-sm text-muted-foreground">
                {groups[cat].length} {groups[cat].length === 1 ? "template" : "templates"}
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groups[cat].map((t) => (
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

function TemplateCard({ t }: { t: SignTemplate }) {
  const editable = t.editableFields.length > 0;
  return (
    <Link
      href={`/create?template=${t.id}`}
      className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-parkwell-blue/40 hover:shadow-lg transition-all"
    >
      <div className="relative aspect-[4/5] bg-muted/40 overflow-hidden">
        <Image
          src={t.sourceImage}
          alt={t.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-6 group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
      <div className="p-5 border-t border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sign #{t.number}
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              editable
                ? "bg-parkwell-blue/10 text-parkwell-blue"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {editable ? "Customizable" : "Fixed art"}
          </span>
        </div>
        <h3 className="text-base font-semibold">{t.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{t.description}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t.sizes[0].widthIn}&quot; × {t.sizes[0].heightIn}&quot;
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-parkwell-blue group-hover:gap-2 transition-all">
            Start order <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
