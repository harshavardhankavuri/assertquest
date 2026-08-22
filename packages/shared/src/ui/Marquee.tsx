import type { ReactNode } from "react";

/**
 * Infinite scrolling strip (PRD §6 "infinite marquee for module list").
 * Content is duplicated once so the loop is seamless; `motion-reduce:animate-none`
 * freezes it for users who asked for reduced motion instead of hiding the content.
 */
export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden py-2" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-10 motion-reduce:animate-none">
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10">{children}</div>
      </div>
    </div>
  );
}
