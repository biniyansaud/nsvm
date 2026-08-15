import { useEffect, useState, useCallback } from "react";

export interface ScrollSpyOptions {
  /** Array of section HTML element IDs to monitor */
  sectionIds: string[];
  /** Offset from the top of the viewport in pixels when determining active section (default: 180) */
  offset?: number;
  /** Whether to sync the active section ID to the URL hash via replaceState (default: false) */
  updateHash?: boolean;
}

/**
 * Custom React hook `useScrollSpy` that monitors section visibility in the viewport
 * and returns the ID of the section currently active.
 *
 * @param input Array of section IDs OR ScrollSpyOptions configuration object
 * @param defaultOffset Optional offset in pixels if first argument is array of IDs
 * @returns string ID of the section currently in viewport
 */
export function useScrollSpy(
  input: string[] | ScrollSpyOptions,
  defaultOffset: number = 180
): string {
  const options: ScrollSpyOptions = Array.isArray(input)
    ? { sectionIds: input, offset: defaultOffset, updateHash: false }
    : input;

  const { sectionIds, offset = 180, updateHash = false } = options;
  const [activeId, setActiveId] = useState<string>("");

  const checkActiveSection = useCallback(() => {
    if (typeof window === "undefined" || !sectionIds || sectionIds.length === 0) {
      return;
    }

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;

    // 1. If at top of page, activate first section or empty
    if (scrollY < 80) {
      const topId = sectionIds[0] || "";
      if (activeId !== topId) {
        setActiveId(topId);
        if (updateHash && window.location.hash !== "") {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
      return;
    }

    // 2. If at bottom of page, activate last section
    if (scrollY + windowHeight >= scrollHeight - 30) {
      const lastId = sectionIds[sectionIds.length - 1];
      if (lastId && activeId !== lastId) {
        setActiveId(lastId);
        if (updateHash && window.location.hash !== `#${lastId}`) {
          window.history.replaceState(null, "", `#${lastId}`);
        }
      }
      return;
    }

    // 3. Find section currently intersecting top offset zone
    let currentId = "";
    for (let i = sectionIds.length - 1; i >= 0; i--) {
      const id = sectionIds[i];
      const element = document.getElementById(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.top <= offset) {
          currentId = id;
          break;
        }
      }
    }

    if (currentId && currentId !== activeId) {
      setActiveId(currentId);
      if (updateHash && window.location.hash !== `#${currentId}`) {
        window.history.replaceState(null, "", `#${currentId}`);
      }
    }
  }, [sectionIds, offset, updateHash, activeId]);

  useEffect(() => {
    checkActiveSection();

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [checkActiveSection]);

  return activeId;
}

export default useScrollSpy;
