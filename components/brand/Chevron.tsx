import { cn } from "@/lib/utils";

/**
 * Parkwell directional chevron — the second signature graphic from the brand
 * guide (image10.svg). Always points right by default; flip via className.
 */
export function Chevron({
  className,
  color = "currentColor",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 341 1270"
      className={cn("inline-block", className)}
      aria-hidden
    >
      <path
        d="M0 1269.77 0 0 337.12 620.06C342.15 629.3 342.15 640.46 337.12 649.71L0 1269.77Z"
        fill={color}
      />
    </svg>
  );
}
