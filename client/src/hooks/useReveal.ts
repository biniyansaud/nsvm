/*
 * useReveal — global scroll-reveal observer.
 *  Selects every element with `.reveal`, `.reveal-up`, `.reveal-left`,
 *  `.reveal-right`, `.reveal-zoom`, or `.stagger`, and adds `.is-visible`
 *  the moment it enters the viewport. Re-scans on each route change.
 */
import { useEffect } from "react";
import { useLocation } from "wouter";

const SELECTOR =
  ".reveal, .reveal-up, .reveal-left, .reveal-right, .reveal-zoom, .stagger";

export function useReveal() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let observer: IntersectionObserver | null = null;

    // Tiny delay so newly-rendered DOM is in place without making page load feel slow.
    const id = window.setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>("main > section:not(:first-child):not([data-no-reveal])")
        .forEach((section) => {
          if (
            !section.classList.contains("reveal") &&
            !section.classList.contains("reveal-up") &&
            !section.classList.contains("reveal-left") &&
            !section.classList.contains("reveal-right") &&
            !section.classList.contains("reveal-zoom")
          ) {
            section.classList.add("reveal-up");
          }
        });

      const targets = Array.from(
        document.querySelectorAll<HTMLElement>(SELECTOR),
      ).filter((el) => !el.classList.contains("is-visible"));

      if (targets.length === 0) return;

      // Respect reduced-motion users
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        targets.forEach((el) => el.classList.add("is-visible"));
        return;
      }

      if (!("IntersectionObserver" in window)) {
        targets.forEach((el) => el.classList.add("is-visible"));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              observer?.unobserve(e.target);
            }
          });
        },
        { rootMargin: "0px 0px 12% 0px", threshold: 0.01 },
      );

      targets.forEach((el) => observer?.observe(el));
    }, 10);

    return () => {
      window.clearTimeout(id);
      observer?.disconnect();
    };
  }, [location]);
}
