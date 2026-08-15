import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  duration?: number; // in seconds
}

export default function AnimatedCounter({ value, suffix = "", duration = 2 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = value;
    if (start === end) return;

    // Total duration of animation in milliseconds
    const totalMiliseconds = duration * 1000;
    
    // Determine the step time (aiming for 60fps)
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(totalMiliseconds / frameRate);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      // Ease out quad formula for smooth decelerating animation
      const progress = frame / totalFrames;
      const easedProgress = progress * (2 - progress);
      
      const currentCount = Math.round(easedProgress * end);
      setCount(currentCount);

      if (frame === totalFrames) {
        setCount(end);
        clearInterval(counter);
      }
    }, frameRate);

    return () => clearInterval(counter);
  }, [isInView, value, duration]);

  return (
    <span
      ref={ref}
      data-no-translate
      className="font-serif-heading font-extrabold text-4xl sm:text-5xl text-secondary tabular-nums"
      style={{ fontFamily: "var(--font-display)" }}
    >
      {count}
      {suffix}
    </span>
  );
}
