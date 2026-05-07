import { cn } from "@/lib/utils";

/**
 * Parkwell lockup — lowercase "p" mark + wordmark.
 * Source: extracted from GUIDE_SIGNS_START HERE.pptx (image1.png).
 * The PNG is white-on-transparent; we drive color via CSS mask so the same
 * file renders in any brand color (white on dark, Ink on light, etc.).
 */
export function Logo({
  tone = "ink",
  className,
}: {
  tone?: "white" | "ink" | "current";
  className?: string;
}) {
  const color =
    tone === "white"
      ? "#ffffff"
      : tone === "ink"
        ? "#0a202e"
        : "currentColor";

  return (
    <span
      aria-label="Parkwell"
      role="img"
      className={cn("inline-block aspect-[2500/546] w-32", className)}
      style={{
        backgroundColor: color,
        WebkitMaskImage: "url(/brand/parkwell-logo-white.png)",
        maskImage: "url(/brand/parkwell-logo-white.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "left center",
        maskPosition: "left center",
      }}
    />
  );
}
