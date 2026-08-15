import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ScrollToTopProps {
  threshold?: number;
  ariaLabel?: string;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  threshold = 80,
  ariaLabel = "Scroll back to top of page",
  className = "",
  scrollContainerRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLaunching, setIsLaunching] = useState(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkScrollAndPosition = () => {
      const container = scrollContainerRef?.current;
      let scrollTop = 0;
      let maxScroll = 1;

      if (container) {
        scrollTop = container.scrollTop;
        maxScroll = Math.max(1, container.scrollHeight - container.clientHeight);
      } else {
        scrollTop =
          window.pageYOffset ||
          document.documentElement.scrollTop ||
          document.body.scrollTop ||
          0;

        const docHeight =
          document.documentElement.scrollHeight ||
          document.body.scrollHeight ||
          1;
        maxScroll = Math.max(1, docHeight - window.innerHeight);
      }

      // Calculate progress percentage (0% at top, 100% at bottom)
      const progress = Math.min(
        100,
        Math.max(0, (scrollTop / maxScroll) * 100)
      );
      setScrollProgress(progress);

      // Check if developer badge or footer bottom is approaching the bottom of viewport
      let isNearFooter = false;
      const devCreditEl =
        document.getElementById("developer-credit-biniyan-container") ||
        document.querySelector(".footer-bottom");

      if (devCreditEl) {
        const rect = devCreditEl.getBoundingClientRect();
        // Hide button as soon as top of developer badge / footer-bottom gets near viewport bottom
        if (rect.top <= window.innerHeight - 20) {
          isNearFooter = true;
        }
      }

      const isHiddenByBodyClass = document.body.classList.contains(
        "hide-floating-widgets"
      );

      // Visible ONLY when scrolled past threshold AND NOT near footer AND NOT hidden by body class
      const shouldShow =
        scrollTop > threshold && !isNearFooter && !isHiddenByBodyClass;

      setIsVisible(shouldShow);
    };

    const onScroll = () => {
      if (rafId.current !== null) return;
      rafId.current = window.requestAnimationFrame(() => {
        checkScrollAndPosition();
        rafId.current = null;
      });
    };

    // Initial evaluation
    checkScrollAndPosition();

    // Attach scroll listeners
    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener("scroll", onScroll, { passive: true });
    } else {
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    }

    window.addEventListener("resize", onScroll, { passive: true });

    // MutationObserver on document.body class changes for "hide-floating-widgets"
    const mutationObserver = new MutationObserver(() => {
      checkScrollAndPosition();
    });
    mutationObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // IntersectionObserver on developer credit element for quick response
    let intersectionObserver: IntersectionObserver | null = null;
    const targetEl =
      document.getElementById("developer-credit-biniyan-container") ||
      document.querySelector(".footer-bottom");

    if (targetEl) {
      intersectionObserver = new IntersectionObserver(
        () => {
          checkScrollAndPosition();
        },
        { root: null, threshold: [0, 0.05, 0.1, 0.2] }
      );
      intersectionObserver.observe(targetEl);
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", onScroll);
      } else {
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("scroll", onScroll, true);
      }

      window.removeEventListener("resize", onScroll);

      mutationObserver.disconnect();
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }

      if (rafId.current !== null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [threshold, scrollContainerRef]);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;

    setIsLaunching(true);
    setTimeout(() => setIsLaunching(false), 700);

    const container = scrollContainerRef?.current;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  // SVG Progress ring geometry
  const radius = 22;
  const circumference = 2 * Math.PI * radius; // ~138.23
  const strokeDashoffset =
    circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          type="button"
          aria-label={ariaLabel}
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.3, y: 20 }}
          animate={{
            opacity: 1,
            scale: isLaunching ? [1, 1.25, 0.9, 1] : 1,
            y: isLaunching ? -16 : 0,
            rotate: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.3,
            y: 20,
            transition: { duration: 0.25, ease: "easeIn" },
          }}
          whileHover={{ scale: 1.12, y: -4 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 340, damping: 22 }}
          className={`scroll-top fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#a61f33] via-[#881337] to-[#4c0519] text-white border-2 border-amber-400 shadow-[0_8px_25px_rgba(136,19,55,0.65)] backdrop-blur-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${className}`}
        >
          {/* Outer Ambient Glowing Pulse Halo */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400/40 via-rose-500/30 to-amber-400/40 blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 -z-10 animate-pulse" />

          {/* Radial Scroll Progress Ring SVG */}
          <svg
            className="absolute inset-0 h-full w-full -rotate-90 transform pointer-events-none"
            viewBox="0 0 56 56"
          >
            {/* Track Circle */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              className="stroke-amber-400/20"
              strokeWidth="2.5"
              fill="transparent"
            />
            {/* Fill Progress Circle */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              className="stroke-amber-300 transition-all duration-150 ease-out"
              strokeWidth="3.2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Floating / Launching Up Arrow Icon */}
          <motion.div
            animate={{
              y: isLaunching ? [0, -20, 0] : [0, -3, 0],
              scale: isLaunching ? [1, 1.3, 1] : 1,
            }}
            transition={{
              y: isLaunching
                ? { duration: 0.5, ease: "easeOut" }
                : { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
            }}
            className="relative z-10 flex items-center justify-center"
          >
            <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-colors duration-200 group-hover:text-white" />
          </motion.div>

          {/* Sparkle Icon on Hover */}
          <motion.div
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          >
            <Sparkles className="h-3 w-3 text-amber-300" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTop;
