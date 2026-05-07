import { Hero } from "@/components/sections/Hero";
import { Mission } from "@/components/sections/Mission";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SignLibraryPreview } from "@/components/sections/SignLibraryPreview";
import { SignOfTheMonth } from "@/components/sections/SignOfTheMonth";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Mission />
      <HowItWorks />
      <SignLibraryPreview />
      <SignOfTheMonth />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
