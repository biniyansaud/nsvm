import { useState, type KeyboardEvent } from "react";
import { ChevronRight } from "lucide-react";

interface FlipCardProps {
  title: string;
  subtitle: string;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  icon?: React.ReactNode;
  colorClass?: string;
}

export default function FlipCard({
  title,
  subtitle,
  frontContent,
  backContent,
  icon,
  colorClass = "bg-primary text-primary-foreground",
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => setIsFlipped((value) => !value);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleFlip();
    }
  };

  return (
    <div
      className="flip-card-shell w-full h-[230px] sm:h-[260px] lg:h-[270px] perspective-1000 cursor-pointer group"
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) {
          setIsFlipped(true);
        }
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) {
          setIsFlipped(false);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isFlipped}
      aria-label={`${title} details`}
    >
      <div
        className={`flip-card-inner w-full h-full preserve-3d relative ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front Side */}
        <div className="flip-card-face flip-card-front absolute inset-0 w-full h-full backface-hidden rounded-2xl border border-border shadow-md bg-card p-5 sm:p-6 flex flex-col overflow-hidden">
          {/* Decorative Gold Corner */}
          <div className="flip-card-corner absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-secondary/10 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div className="flip-card-icon bg-primary/5 text-secondary p-2.5 sm:p-3 rounded-lg shadow-sm border border-secondary/10">
                {icon}
              </div>
              <span className="text-[10px] font-sans tracking-widest uppercase font-bold text-secondary">
                {subtitle}
              </span>
            </div>
            <h3 className="font-serif-heading font-bold text-lg sm:text-xl text-primary leading-snug group-hover:text-secondary transition-colors duration-200" style={{ fontFamily: "var(--font-display)" }}>
              {title}
            </h3>
            <div className="flip-card-copy font-serif-body text-sm text-muted-foreground line-clamp-3 sm:line-clamp-4" style={{ fontFamily: "var(--font-sans)" }}>
              {frontContent}
            </div>
          </div>

          <div className="flip-card-action mt-5 flex items-center gap-1.5 text-xs font-semibold text-secondary group-hover:gap-2.5 transition-all">
            <span>Explore Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Back Side */}
        <div className={`flip-card-face flip-card-back absolute inset-0 w-full h-full backface-hidden shadow-lg p-5 sm:p-6 flex flex-col justify-between overflow-hidden ${colorClass}`}>
          {/* Mandala-inspired abstract background watermark */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none border border-white/10" />
          
          <div className="flex flex-col gap-3 sm:gap-4">
            <h3 className="font-serif-heading font-bold text-lg sm:text-xl text-secondary" style={{ fontFamily: "var(--font-display)" }}>
              {title} Curriculum
            </h3>
            <div className="flip-card-copy font-serif-body text-sm text-primary-foreground/90 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
              {backContent}
            </div>
          </div>

          <div className="hidden sm:block text-xs font-sans tracking-wider text-secondary font-semibold uppercase border-t border-white/10 pt-3">
            New SaraswatiAcademic Program
          </div>
        </div>
      </div>
    </div>
  );
}
