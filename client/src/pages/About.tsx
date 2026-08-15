import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Library,
  Medal,
  Microscope,
  Quote,
  Sparkles,
  Trophy,
  Users,
  Clock,
  Briefcase,
  ChevronRight,
  Activity
} from "lucide-react";
import { ASSETS, LEADERSHIP, SCHOOL } from "@/const";
import AnimatedCounter from "@/components/AnimatedCounter";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

const quickFacts = [
  { label: "Established", value: SCHOOL.established, icon: Award },
  { label: "Students", value: "1300+", icon: Users },
  { label: "Programs", value: "Montessori to XII", icon: GraduationCap },
  { label: "Streams", value: "Management (XI–XII)", icon: BookOpen },
];

const strengths = [
  {
    title: "Dedicated Faculty",
    body: "Experienced teachers guide students through structured lessons, regular feedback, and personal academic care.",
    icon: Users,
    detail: "Our student-teacher ratio is maintained at 25:1 to ensure personalized coaching, with bi-weekly diagnostic reviews.",
    metric: "25:1 Ratio"
  },
  {
    title: "Science & Computer Labs",
    body: "Practical learning is supported through laboratory work, multimedia classes, and technology-based practice.",
    icon: Microscope,
    detail: "Equipped with modern chemistry, physics, and biology equipment alongside a fiber-optic enabled PC lab.",
    metric: "3 Modern Labs"
  },
  {
    title: "Value-Based Schooling",
    body: "NSVM joins academic progress with discipline, confidence, moral responsibility, and public-minded character.",
    icon: HeartHandshake,
    detail: "Integrating moral assemblies, leadership workshops, and civic community programs into daily life.",
    metric: "100% Value Focus"
  },
  {
    title: "Modern Learning Culture",
    body: "Project work, counselling, library reading, activities, and tours help students learn beyond textbooks.",
    icon: Library,
    detail: "Featuring dynamic extracurricular programs, outdoor research, creative art clubs, and field excursions.",
    metric: "15+ Club Groups"
  },
];

const milestones = [
  {
    year: "2060 B.S.",
    title: "The Foundation",
    description: "Founded by highly respected, veteran academicians in BDM-12, Airy, Kanchanpur with a vision to deliver quality education and character foundation.",
    icon: Award
  },
  {
    year: "2068 B.S.",
    title: "NEB Accreditation",
    description: "Formally launched the high-school curriculum, establishing the NEB Management stream for Grades XI and XII to support career-oriented students.",
    icon: GraduationCap
  },
  {
    year: "2073 B.S.",
    title: "Complete Integration",
    description: "Unified our entire campus structure from Montessori to Grade 12, creating a single academic home for stable educational growth.",
    icon: Building2
  },
  {
    year: "Present",
    title: "Modern Multi-Stream Era",
    description: "Serving over 1,300 learners with advanced digital systems, state-of-the-art computer networks, and practical science labs in BDM-12, Airy, Kanchanpur.",
    icon: Sparkles
  }
];

const values = [
  "Quality education",
  "Confidence building",
  "Character formation",
  "Guardian partnership",
  "Practical exposure",
  "Career readiness",
];

export default function About() {
  const { t } = useLanguage();
  const [activeMilestone, setActiveMilestone] = useState(0);
  const [expandedStrength, setExpandedStrength] = useState<number | null>(null);

  return (
    <>
      <SEO
        title="About Us — History, Mission & Leadership"
        description="Learn about New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) established in 2060 B.S. in BDM-12 Airy, Kanchanpur. Discover our mission, values, academic legacy, and leadership."
        keywords="About New Saraswati, newsaraswati, new saraswati vidya mandir, History New Saraswati Vidya Mandir, NSVM Leadership, New Saraswati School Kanchanpur, BDM-12 Airy, Principal New Saraswati"
        canonical="/about"
        pageType="AboutPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "About Us", path: "/about" },
        ]}
      />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${ASSETS.hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.24,
            mixBlendMode: "overlay",
          }}
        />

        <div className="container relative z-10 py-20 sm:py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-7">
              <span className="eyebrow-pill anim-fade-up">
                <Sparkles className="h-3 w-3 text-secondary" />
                {t("About New Saraswati Vidya Mandir Secondary School")}
              </span>
              <h1
                className="text-white mt-6 anim-fade-up font-display font-extrabold"
                style={{
                  fontSize: "clamp(2.15rem, 1.35rem + 3.8vw, 4.85rem)",
                  lineHeight: 1.04,
                  animationDelay: "80ms",
                }}
              >
                {t("Quality education with confidence and character.")}
              </h1>
              <p
                className="mt-6 max-w-2xl text-white/84 anim-fade-up"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "clamp(1rem, 0.92rem + 0.45vw, 1.18rem)",
                  lineHeight: 1.7,
                  animationDelay: "150ms",
                }}
              >
                {t(
                  "New Saraswati Vidya Mandir is a community-rooted academic institution in BDM-12, Airy, Kanchanpur. The school blends clear academic pathways, disciplined routines, practical exposure, and close guidance so students can grow with confidence.",
                )}
              </p>
              <div className="mt-9 flex flex-wrap gap-3 anim-fade-up" style={{ animationDelay: "220ms" }}>
                <a href="/courses" className="btn-gold shine">
                  {t("Explore Programs")} <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/contact"
                  className="btn-ghost"
                  style={{
                    background: "transparent",
                    color: "white",
                    borderColor: "rgba(255,255,255,0.35)",
                  }}
                >
                  {t("Contact School")}
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 anim-fade-up" style={{ animationDelay: "260ms" }}>
              <div className="grid grid-cols-2 gap-4">
                {quickFacts.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md"
                  >
                    <Icon className="h-6 w-6 text-[var(--color-gold-soft)]" />
                    <div className="mt-4 text-2xl font-bold text-white font-display">{t(value)}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/65 font-bold">
                      {t(label)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-32">
              <div className="image-frame hover-zoom">
                <ImageWithSkeleton
                  src={ASSETS.campus}
                  alt="New Saraswati Vidya Mandir campus"
                  loading="lazy"
                  decoding="async"
                  aspectRatio="aspect-[4/5]"
                  className="w-full h-full object-cover"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <span className="eyebrow-left">{t("Our Identity")}</span>
              <h2 className="section-heading mt-5">
                {t("A complete academic home from early learning to Grade XII.")}
              </h2>
              <p className="section-lead mt-7">
                {t(
                  "New Saraswati Vidya Mandir Secondary School was founded in 2060 B.S. by highly experienced and dedicated academicians. The institution offers Montessori through Grade 10 and NEB Management stream at Grades XI and XII.",
                )}
              </p>
              <p className="section-lead mt-5">
                {t(
                  "Today, NSVM combines structured academics, caring mentorship, practical exposure, labs, library learning, sports, cultural activities, and guardian partnership to support around 1300 students across BDM-12, Airy, Kanchanpur and nearby communities.",
                )}
              </p>

              {/* Interactive Milestone Timeline */}
              <div className="mt-8">
                <span className="text-xs font-bold text-secondary tracking-widest uppercase block mb-3">
                  {t("Interactive Historical Path")}
                </span>
                
                {/* Horizontal Year Selector */}
                <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none">
                  {milestones.map((milestone, idx) => {
                    const isSelected = activeMilestone === idx;
                    return (
                      <button
                        key={milestone.year}
                        onClick={() => setActiveMilestone(idx)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black font-sans transition-all duration-300 border flex items-center gap-1.5 shrink-0 active:scale-95 ${
                          isSelected
                            ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                            : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {t(milestone.year)}
                      </button>
                    );
                  })}
                </div>

                {/* Animated Timeline Display Card */}
                <div className="mt-4 min-h-[140px]">
                  <AnimatePresence mode="wait">
                    {milestones.map((milestone, idx) => {
                      if (activeMilestone !== idx) return null;
                      const MilestoneIcon = milestone.icon;
                      return (
                        <motion.div
                          key={milestone.year}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex gap-4 items-start relative overflow-hidden shadow-sm"
                        >
                          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-primary pointer-events-none">
                            <MilestoneIcon className="h-28 w-28" />
                          </div>
                          
                          <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0 border border-secondary/15">
                            <MilestoneIcon className="h-5 w-5" />
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <span className="text-xs font-black uppercase text-secondary tracking-wider font-sans">
                                {t(milestone.year)}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline" />
                              <h4 className="font-display font-extrabold text-base text-primary">
                                {t(milestone.title)}
                              </h4>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                              {t(milestone.description)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white border-y border-slate-200/70">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span className="eyebrow-pill">{t("Why NSVM")}</span>
            <h2 className="section-title mt-5">{t("What Makes the School Strong")}</h2>
            <p className="mt-5 text-slate-600 leading-relaxed">
              {t(
                "The school experience is organized around academics, discipline, exposure, and care so students can progress confidently at every level.",
              )}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {strengths.map(({ title, body, icon: Icon, detail, metric }, idx) => {
              const isExpanded = expandedStrength === idx;
              return (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  onClick={() => setExpandedStrength(isExpanded ? null : idx)}
                  className={`soft-card p-6 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    isExpanded
                      ? "ring-2 ring-secondary bg-slate-50/50 shadow-md"
                      : "hover:shadow-lg hover:-translate-y-1.5"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div
                        className="h-12 w-12 rounded-2xl inline-flex items-center justify-center bg-secondary/10 border border-secondary/15"
                      >
                        <Icon className="h-6 w-6 text-secondary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-secondary px-2.5 py-1 rounded-full bg-secondary/5 border border-secondary/10 font-sans">
                        {t(metric)}
                      </span>
                    </div>

                    <h3 className="mt-5 font-display text-lg font-black text-primary leading-snug">
                      {t(title)}
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-500 font-sans">
                      {t(body)}
                    </p>
                  </div>

                  {/* Expandable Detail Panel */}
                  <div className="mt-4 pt-4 border-t border-slate-100/70">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                      <Activity className={`h-3.5 w-3.5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                      <span>{isExpanded ? t("Click to collapse") : t("Click to reveal details")}</span>
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-3 text-xs leading-relaxed text-slate-600 bg-secondary/5 border border-secondary/10 p-3 rounded-xl font-sans font-medium italic">
                            {t(detail)}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-6 soft-card p-7 md:p-9 hover-lift">
              <Compass className="h-8 w-8 text-secondary" />
              <h2 className="mt-5 section-title text-left">{t("Vision")}</h2>
              <p className="mt-4 text-slate-600 leading-8">
                {t(
                  "To produce world-class citizens with leadership capacity, strong moral values, and the confidence to meet the demands of the 21st century.",
                )}
              </p>
            </div>
            <div className="lg:col-span-6 soft-card p-7 md:p-9 hover-lift">
              <Building2 className="h-8 w-8 text-secondary" />
              <h2 className="mt-5 section-title text-left">{t("Mission")}</h2>
              <p className="mt-4 text-slate-600 leading-8">
                {t(
                  "To develop creative, critical, and practical learners through quality teaching, modern facilities, regular evaluation, and close school-family coordination.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex flex-wrap gap-3">
              {values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-[var(--color-navy)]"
                >
                  <Medal className="h-4 w-4 text-secondary" />
                  {t(value)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="stats">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto">
            <span
              className="eyebrow-pill"
              style={{
                color: "var(--color-gold-soft)",
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <Trophy className="h-3 w-3" />
              {t("NSVM in Numbers")}
            </span>
            <h2 className="section-title text-white mt-5">{t("Growing with BDM-12, Airy, Kanchanpur")}</h2>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedCounter value={2060} suffix=" B.S." />
              </div>
              <p>{t("Established")}</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedCounter value={1300} suffix="+" />
              </div>
              <p>{t("Students")}</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <p>{t("Faculty & Staff")}</p>
            </div>
            <div className="stat-item">
              <div className="stat-number">
                <AnimatedCounter value={12} suffix="" />
              </div>
              <p>{t("Class Levels")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-[#f5f8fc]">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5">
              <div className="image-frame hover-zoom">
                <ImageWithSkeleton
                  src={LEADERSHIP.principal.image}
                  alt={LEADERSHIP.principal.name}
                  loading="lazy"
                  decoding="async"
                  aspectRatio="aspect-[4/5]"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 18%" }}
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
            <div className="lg:col-span-7">
              <span className="eyebrow-left">{t("Leadership Message")}</span>
              <div className="leadership-quote-card mt-6">
                <div className="leadership-quote-mark">
                  <Quote className="h-6 w-6" />
                </div>
                <blockquote
                  className="text-[var(--color-navy)] font-medium"
                  style={{
                    fontFamily: "var(--font-quote)",
                    fontSize: "clamp(1.05rem, 0.92rem + 0.7vw, 1.42rem)",
                    lineHeight: 1.72,
                  }}
                >
                  "{t(LEADERSHIP.principal.quote)}"
                </blockquote>
                <div className="leadership-person-row">
                  <div className="h-px w-12 shrink-0" style={{ background: "var(--color-gold)" }} />
                  <div>
                    <div className="font-display text-2xl font-bold text-[var(--color-navy)]">
                      {t(LEADERSHIP.principal.name)}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-secondary font-bold">
                      {t(LEADERSHIP.principal.role)}
                    </div>
                  </div>
                </div>
              </div>
              <a href={`tel:${SCHOOL.contact.replace(/\s/g, "")}`} className="btn-gold mt-8 shine">
                {t("Admission Enquiry")} <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
