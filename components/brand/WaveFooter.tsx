import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

/**
 * Signature Parkwell footer — the wave shape transitioning into the Ink band
 * with the white logo centered. Used at the bottom of every sign and as the
 * site footer's brand band.
 *
 * Wave path is the same one extracted from the brand guide (image34.svg).
 */
export function WaveFooter({
  className,
  showLogo = true,
  ratio,
}: {
  className?: string;
  showLogo?: boolean;
  /** Optional: aspect ratio override for use inside fixed-aspect sign canvases. */
  ratio?: string;
}) {
  return (
    <div
      className={cn("relative w-full", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <svg
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        className="absolute top-0 left-0 w-full h-[28%]"
        aria-hidden
      >
        <path
          d="M432.152 0C149.61 0 0 55.093 0 55.093L0 199.144 1440 199.144 1440 0C1440 0 1229.23 47.5114 1002.29 47.5114 775.346 47.5114 714.693 0 432.152 0Z"
          fill="#0A202E"
        />
      </svg>
      <div
        className="absolute bottom-0 left-0 w-full bg-ink"
        style={{ height: "calc(100% - 28% + 1px)", marginTop: "-1px" }}
      />
      {showLogo && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-[8%]">
          <Logo tone="white" className="w-[34%] max-w-[200px]" />
        </div>
      )}
    </div>
  );
}
