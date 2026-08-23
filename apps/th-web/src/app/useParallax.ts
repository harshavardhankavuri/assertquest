import { useEffect, useRef } from "react";

// Lightweight scroll-linked parallax for decorative background layers only —
// never applied to text or interactive controls (see ui-ux-pro-max skill's
// "Parallax Scroll" guidance). `speed` is the fraction of scroll distance the
// element trails by: background layers use a small value (0.05-0.15), never
// applied at all under prefers-reduced-motion, which renders the static
// resting position instead.
export function useParallax<T extends HTMLElement>(speed: number) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ticking = false;
    function update() {
      ticking = false;
      const rect = el!.getBoundingClientRect();
      // Distance the element's center sits from the viewport center — driving
      // the offset off element position (not raw scrollY) keeps the effect
      // correct regardless of where the section lands on the page.
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
      el!.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed]);

  return ref;
}
