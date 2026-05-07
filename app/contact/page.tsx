import Link from "next/link";
import { Mail, Globe, MapPin } from "lucide-react";
import { LinkedInIcon } from "@/components/icons/LinkedInIcon";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/Reveal";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the team."
        description="Questions about a sign order, an approval, or the platform itself? Get in touch and we'll route you to the right person."
      />

      <section className="mx-auto max-w-5xl px-5 md:px-8 pb-24">
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <ContactCard
              icon={Mail}
              title="Sign program lead"
              primary="Michael Miller, President"
              secondary="michael@goparkwell.com"
              href="mailto:michael@goparkwell.com"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <ContactCard
              icon={Globe}
              title="Parkwell on the web"
              primary="goparkwell.com"
              secondary="The consumer Go Parkwell app and B2B services"
              href="https://goparkwell.com"
              external
            />
          </Reveal>
          <Reveal delay={0.16}>
            <ContactCard
              icon={LinkedInIcon}
              title="LinkedIn"
              primary="Follow us"
              secondary="Launch announcements, new locations, team news"
              href="https://www.linkedin.com/company/goparkwell"
              external
            />
          </Reveal>
          <Reveal delay={0.24}>
            <ContactCard
              icon={MapPin}
              title="Headquarters"
              primary="Denver, CO"
              secondary="Operating across CO · CA · UT · FL"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ContactCard({
  icon: Icon,
  title,
  primary,
  secondary,
  href,
  external,
}: {
  icon: React.ElementType;
  title: string;
  primary: string;
  secondary: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <div className="rounded-2xl border border-border bg-card p-6 hover:border-parkwell-blue/40 transition-colors h-full">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-parkwell-blue/10 text-parkwell-blue">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
        {title}
      </div>
      <div className="mt-1 text-lg font-semibold">{primary}</div>
      <div className="mt-1 text-sm text-muted-foreground">{secondary}</div>
    </div>
  );
  if (!href) return content;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {content}
    </a>
  ) : (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
