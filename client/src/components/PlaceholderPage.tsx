/*
 * PlaceholderPage — "coming soon" experience for non-About routes.
 * Styled in the unified brand language (Cinzel, gold underline rule, navy CTA).
 */
import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";

export default function PlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[480px] pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, rgba(197,155,39,0.16) 0%, transparent 70%), radial-gradient(80% 60% at 100% 0%, rgba(10,59,117,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="container relative py-24 md:py-36">
        <div className="max-w-2xl mx-auto text-center anim-fade-up">
          <span className="eyebrow-pill">
            <Sparkles className="h-3 w-3" />
            {eyebrow}
          </span>
          <h1 className="section-title mt-6" style={{ fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3.5rem)" }}>
            {title}
          </h1>
          <p className="mt-7 text-[16px] md:text-[17px] leading-relaxed text-slate-600">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/about" className="btn-cta">
              Visit About <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="btn-ghost">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
