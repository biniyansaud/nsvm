import { Link } from "wouter";
import { useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  Compass,
  GraduationCap,
  HeartHandshake,
  Microscope,
  Quote,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users2,
  Laptop,
  Palette,
  Briefcase,
  TrendingUp,
  Flame,
  CheckCircle,
  HelpCircle,
  Clock,
  MapPin,
  Sparkle
} from "lucide-react";
import { ASSETS, LEADERSHIP, SCHOOL } from "@/const";
import AnimatedCounter from "@/components/AnimatedCounter";
import FlipCard from "@/components/FlipCard";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendVisitorIpToDiscord } from "@/lib/discordWebhook";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollSpy } from "@/hooks/useScrollSpy";

const HOME_SECTIONS = [
  "hero",
  "welcome",
  "why-us",
  "programs",
  "pathways",
  "daily-rhythm",
  "notices",
  "achievements",
  "gallery",
  "admission-cta",
];

// Interactive Pathway Data
const PATHWAYS_DATA = {
  science: {
    id: "science",
    title: "Science & Technology Track",
    subtitle: "Nurturing logical thinking, empirical research, and digital mastery",
    focus: "Grades 1 to 10 practical sessions, computer literacy, and advanced high school preparation",
    color: "from-blue-700 to-indigo-800",
    lightBg: "bg-blue-50/40",
    icon: <Microscope className="h-6 w-6 text-white" />,
    badgeColor: "bg-blue-100/80 text-blue-800 border-blue-200",
    subjects: ["Interactive General Science", "Practical Laboratory Physics & Chemistry", "Computer Science & IT Fundamentals", "Optional Mathematics"],
    facilities: "Fully equipped general science labs, biological specimens, computer lab with broadband, multimedia smart classes.",
    activities: "Annual Science & Tech Fair, coding competitions, Robotics workshops, environment conservation club.",
    future: "SEE excellence, transition to +2 Science stream, engineering, medicine, and research tracks."
  },
  management: {
    id: "management",
    title: "Business & Management Leadership",
    subtitle: "Developing financial literacy, entrepreneurial spirit, and public leadership",
    focus: "Comprehensive NEB Grades XI and XII Management stream and early grade enterprise skills",
    color: "from-amber-600 to-[#c59b27]",
    lightBg: "bg-amber-50/40",
    icon: <Briefcase className="h-6 w-6 text-white" />,
    badgeColor: "bg-amber-100/80 text-amber-800 border-amber-200",
    subjects: ["Accountancy & Business Studies", "Principles of Economics", "Computer Science (Management track)", "Business Mathematics"],
    facilities: "Dedicated commerce resource room, guest lecture programs, mock bank counters, business simulation suites.",
    activities: "Inter-school debate championships, Young Entrepreneur projects, business pitching contests, stock market simulators.",
    future: "BBA/BBS degrees, Chartered Accountancy (CA) track, corporate banking, startup ventures."
  },
  arts: {
    id: "arts",
    title: "Creative Arts, Culture & Social Sciences",
    subtitle: "Fostering creative writing, public speech, visual expression, and heritage preservation",
    focus: "Everyday music, dance, visual arts integration across primary and secondary levels",
    color: "from-purple-600 to-indigo-600",
    lightBg: "bg-purple-50/40",
    icon: <Palette className="h-6 w-6 text-white" />,
    badgeColor: "bg-purple-100/80 text-purple-800 border-purple-200",
    subjects: ["Creative English & Nepali Writing", "Social Studies & Local Heritage", "Performing Arts (Music, Dance, Theatre)", "Art & Design Foundations"],
    facilities: "Music and instruments studio, arts & crafts atelier, open-air performance deck, school amphitheater.",
    activities: "Grand annual cultural program, drama productions, literary writing club, folk music ensembles.",
    future: "Mass Communication, humanities, fine arts, public administration, international relations."
  },
  sports: {
    id: "sports",
    title: "Athletic Excellence & Team Sports",
    subtitle: "Building discipline, physical resilience, sportsmanship, and teamwork",
    focus: "Inter-house sports meet, physical training, and province-level competition participation",
    color: "from-emerald-600 to-teal-600",
    lightBg: "bg-emerald-50/40",
    icon: <Trophy className="h-6 w-6 text-white" />,
    badgeColor: "bg-emerald-100/80 text-emerald-800 border-emerald-200",
    subjects: ["Physical Health & Training", "Yoga & Mindfulness Practice", "Coached Team Sports (Football, Basketball)", "Track & Field Athletic Skills"],
    facilities: "Spacious sports turf, volleyball court, indoor table tennis deck, standard track, sports equipment vault.",
    activities: "Inter-house football/cricket leagues, annual athletic meet, yoga workshops, school representative squad coaching.",
    future: "National sports academy trials, physical fitness instructors, public service coaching, athletic career paths."
  }
};

export default function Home() {
  const { t } = useLanguage();
  const [activePathway, setActivePathway] = useState<keyof typeof PATHWAYS_DATA>("science");

  useScrollSpy({
    sectionIds: HOME_SECTIONS,
    offset: 180,
    updateHash: true,
  });

  return (
    <>
      <SEO
        title="New Saraswati Vidya Mandir Secondary School — BDM-12 Airy, Kanchanpur"
        description="Official Portal of New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), BDM-12 Airy, Kanchanpur, Nepal. Offering Montessori to Grade 12 (+2 Management) with modern science & IT labs, experienced faculty, and online admissions."
        keywords="newsaraswati, new saraswati, newsaraswatividyamandir, new saraswati vidya mandir, new saraswati secondary school, new saraswati school, new saraswati kanchanpur, new saraswati airy, nsvm, nsvm kanchanpur, nsvm mahendranagar, nsvm.edu.np, newsaraswati.edu.np, न्यू सरस्वती, न्यू सरस्वती विद्या मन्दिर, Best School in Kanchanpur, +2 Management Kanchanpur, SEE School"
        canonical="/"
        pageType="WebPage"
      />
      {/* ========================  HERO SECTION  ======================== */}
      <section id="hero" className="home-hero relative overflow-hidden flex items-center">
        <div aria-hidden className="absolute inset-0 home-hero-bg" />
        <div
          aria-hidden
          className="absolute inset-0 home-hero-photo"
          style={{
            backgroundImage: `url(${ASSETS.hero})`,
          }}
        />
        <div aria-hidden className="absolute inset-0 home-hero-vignette" />
        <div className="container relative z-10 pt-[10px] sm:pt-14 md:pt-16 lg:pt-20 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-7 text-left order-2 lg:order-1">
              <motion.span
                className="eyebrow-pill"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1], delay: 0.05 }}
              >
                <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
                Excellence in Education Since {SCHOOL.establishedAd}
              </motion.span>

              <motion.h1 
                className="home-hero-title text-wrap-balance"
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.215, 0.61, 0.355, 1], delay: 0.15 }}
              >
                New Saraswati Vidya Mandir Secondary School
              </motion.h1>

              <motion.p
                className="home-hero-lead"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.215, 0.61, 0.355, 1], delay: 0.25 }}
              >
                A disciplined, caring academic community in {SCHOOL.location},
                helping students grow with quality education, confidence, and
                character from Montessori to Grade XII.
              </motion.p>

              <motion.div
                className="home-hero-actions flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mt-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1], delay: 0.35 }}
              >
                <Link
                  href="/apply"
                  className="btn-gold shine w-full sm:w-auto justify-center"
                  onClick={sendVisitorIpToDiscord}
                >
                  Apply Now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/courses"
                  className="btn-ghost home-hero-secondary w-full sm:w-auto justify-center"
                >
                  View Courses <BookOpen className="h-4 w-4" />
                </Link>
              </motion.div>

              <motion.div
                className="hero-proof-grid grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4 mt-6"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                      delayChildren: 0.45
                    }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                <motion.span
                  className="hero-proof-item text-xs sm:text-sm"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <Award className="h-4 w-4 text-secondary shrink-0" />
                  Est. {SCHOOL.established}
                </motion.span>
                <motion.span
                  className="hero-proof-item text-xs sm:text-sm"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <Building2 className="h-4 w-4 text-secondary shrink-0" />
                  BDM-12, Airy, Kanchanpur
                </motion.span>
                <motion.span
                  className="hero-proof-item text-xs sm:text-sm"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
                  }}
                >
                  <Compass className="h-4 w-4 text-secondary shrink-0" />
                  <span className="hero-proof-motto">
                    Quality <span aria-hidden>/</span> Confidence <span aria-hidden>/</span> Character
                  </span>
                </motion.span>
              </motion.div>
            </div>

            <div className="lg:col-span-5 order-1 lg:order-2 pt-0 sm:pt-6 lg:pt-4">
              <motion.div
                className="hero-media-board relative"
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              >
                <div className="hero-media-frame image-frame hover-zoom pulse-gold">
                  <ImageWithSkeleton
                    src={ASSETS.hero}
                    alt="New Saraswati Vidya Mandir campus building"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    aspectRatio="none"
                    containerClassName="hero-media-image w-full h-[210px] sm:h-[320px] lg:h-[480px]"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center center" }}
                    sizes="(max-width: 1024px) 100vw, 580px"
                  />
                </div>

                <motion.div
                  className="hero-quick-card hero-quick-card-main hidden sm:flex items-center gap-3.5 absolute -bottom-5 -left-4 sm:-bottom-6 sm:-left-5 lg:-bottom-7 lg:-left-7 bg-white/98 backdrop-blur-md shadow-2xl rounded-2xl px-5 py-3.5 sm:py-4 float-gentle border border-slate-200/90 z-20"
                  style={{ boxShadow: "0 22px 45px -16px rgba(18,62,115,0.35), 0 8px 20px -8px rgba(0,0,0,0.08)" }}
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.55 }}
                >
                  <div className="hero-quick-icon flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600 shrink-0 border border-amber-200/60">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="hero-quick-copy min-w-0">
                    <strong className="text-sm font-extrabold text-slate-900 block whitespace-nowrap font-display">25+ Years</strong>
                    <span className="text-xs text-slate-600 font-semibold block whitespace-nowrap">Of Quality Education</span>
                  </div>
                </motion.div>

                <motion.div
                  className="hero-quick-card hero-quick-card-top hidden sm:flex items-center gap-3.5 absolute -top-5 -right-3 sm:-top-6 sm:-right-5 lg:-top-7 lg:-right-7 z-20 bg-white/98 backdrop-blur-md shadow-2xl rounded-2xl px-5 py-3.5 sm:py-4 border border-slate-200/90"
                  style={{ boxShadow: "0 22px 45px -16px rgba(18,62,115,0.35), 0 8px 20px -8px rgba(0,0,0,0.08)" }}
                  initial={{ opacity: 0, scale: 0.8, y: -15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.65 }}
                >
                  <div className="hero-quick-icon hero-quick-icon-cool flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-200/60">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="hero-quick-copy min-w-0">
                    <strong className="text-sm font-extrabold text-slate-900 block whitespace-nowrap font-display">Montessori–XII</strong>
                    <span className="text-xs text-slate-600 font-semibold block whitespace-nowrap">Complete Academic Path</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Curved Divider */}
        <svg
          className="absolute bottom-[-1px] left-0 w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ height: "60px", display: "block" }}
          aria-hidden
        >
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#fafbfc" />
        </svg>
      </section>

      {/* ========================  WELCOME / INTRO  ======================== */}
      <section className="container py-20 md:py-28 anchor-offset" id="welcome">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-6 reveal-left">
            <div className="image-frame hover-zoom">
              <ImageWithSkeleton
                src={ASSETS.classroom}
                alt="A classroom at New Saraswati Vidya Mandir Secondary School"
                loading="lazy"
                decoding="async"
                aspectRatio="none"
                containerClassName="w-full h-[360px] sm:h-[440px] lg:h-[520px] rounded-3xl"
                className="w-full h-full object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
              />
            </div>
          </div>
          <div className="lg:col-span-6 reveal-right">
            <span className="eyebrow-left">About Our School</span>
            <h2 className="section-heading mt-4">
              A community-rooted school where{" "}
              <em
                style={{
                  color: "var(--color-gold)",
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                }}
              >
                discipline
              </em>{" "}
              and{" "}
              <em
                style={{
                  color: "var(--color-gold)",
                  fontStyle: "italic",
                  fontFamily: "var(--font-display)",
                }}
              >
                learning
              </em>{" "}
              grow together.
            </h2>
            <p className="section-lead mt-5">
              Established in {SCHOOL.established} ({SCHOOL.establishedAd}),
              New Saraswati Vidya Mandir Secondary School is a modern academic institution founded
              by experienced and dedicated academicians in 2060 B.S. It offers Montessori
              through Grade 10, with NEB Management stream at Grades XI and XII, making
              quality English-medium education accessible in Sudurpaschim Province.
            </p>
            <p className="section-lead mt-4">
              Today the school serves around 1300 learners from Montessori to Grade XII, with
              student-centred teaching, disciplined monitoring, scholarships,
              practical labs, library resources, counselling, sports, cafeteria,
              multimedia learning, and educational tours.
            </p>

            <div className="mt-8 grid sm:grid-cols-2 gap-3.5 stagger reveal">
              {[
                { icon: <ShieldCheck className="h-4 w-4" />, label: "Safe, secure campus" },
                { icon: <Users2 className="h-4 w-4" />, label: "Caring teacher-student bond" },
                { icon: <BookOpen className="h-4 w-4" />, label: "SEE-focused academics" },
                { icon: <Trophy className="h-4 w-4" />, label: "Cultural & sports tradition" },
              ].map((it) => (
                <div
                  key={it.label}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border hover-lift transition"
                  style={{ borderColor: "#eef2f6" }}
                >
                  <span
                    className="w-9 h-9 rounded-lg grid place-items-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(10,59,117,0.08), rgba(197,155,39,0.14))",
                      color: "var(--color-navy)",
                    }}
                  >
                    {it.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "var(--color-ink)",
                    }}
                  >
                    {it.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex justify-center lg:justify-start">
              <Link href="/about" className="btn-cta shine">
                Read full story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================  WHY CHOOSE US  ========================= */}
      <section
        id="why-us"
        className="py-20 md:py-28"
        style={{
          background:
            "linear-gradient(180deg, #fafbfc 0%, #f5f8fc 50%, #fafbfc 100%)",
        }}
      >
        <div className="container">
          <div className="text-center max-w-2xl mx-auto reveal">
            <span className="eyebrow-pill">Why NSVM</span>
            <h2 className="section-title mt-5">Why Choose Our School?</h2>
            <p
              className="mt-5 mx-auto"
              style={{
                fontFamily: "var(--font-sans)",
                color: "var(--brand-slate)",
                fontSize: "1.0625rem",
                lineHeight: 1.65,
                maxWidth: "60ch",
              }}
            >
              Six everyday commitments that shape the character of every
              student who walks through our gate.
            </p>
          </div>

          <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger reveal">
            {[
              {
                icon: <GraduationCap className="h-6 w-6" />,
                title: "Dedicated Faculty",
                desc:
                  "Experienced teachers who invest in each student's progress, character, and confidence - not just exam scores.",
              },
              {
                icon: <Microscope className="h-6 w-6" />,
                title: "Practical Learning",
                desc:
                  "Projects, presentations, field exposure, and lab work make knowledge usable in real life.",
              },
              {
                icon: <Trophy className="h-6 w-6" />,
                title: "SEE Track Record",
                  desc:
                  "A proven record in SEE and NEB examinations, with impressive results from the earliest batches.",
              },
              {
                icon: <HeartHandshake className="h-6 w-6" />,
                title: "Holistic Development",
                desc:
                  "Sports, music, dance, and cultural programmes that build well-rounded young people.",
              },
              {
                icon: <ShieldCheck className="h-6 w-6" />,
                title: "Safe Environment",
                  desc:
                  "A student-friendly, well monitored environment with clear routines and close academic guidance.",
              },
              {
                icon: <Users2 className="h-6 w-6" />,
                title: "Community Partnership",
                desc:
                  "A steady, honest partnership between teachers, students, and guardians every single morning.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  boxShadow: "0 20px 30px -10px rgba(10,59,117,0.12)",
                }}
                viewport={{ once: true }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="feature-card group cursor-pointer"
              >
                <div className="feature-icon group-hover:bg-gradient-gold group-hover:text-white transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="group-hover:text-secondary transition-colors duration-300">{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================  PROGRAMS (Interactive Flip Cards)  ========================= */}
      <section id="programs" className="container py-20 md:py-28">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center lg:items-end mb-12 reveal text-center lg:text-left">
          <div className="lg:col-span-7">
            <span className="eyebrow-left">Academic Levels</span>
            <h2 className="section-heading mt-4">
              Programs that meet students where they are.
            </h2>
          </div>
          <div className="lg:col-span-5 mt-4 lg:mt-0">
            <p className="section-lead">
              From the early grades through the SEE board, our academic ladder
              is designed to grow alongside each child slowly, surely, and with
              real teacher attention at every step.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger reveal">
          <FlipCard
            title="Primary Level"
            subtitle="Grades 1 - 5"
            icon={<BookOpen className="h-6 w-6 text-secondary" />}
            frontContent="Foundational literacy, numeracy, and habit-building in a warm, structured environment."
            backContent={
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2">- Basic English & Nepali Literacy</li>
                <li className="flex items-center gap-2">- Fun Mathematics Foundations</li>
                <li className="flex items-center gap-2">- Creative Arts & Social Habits</li>
                <li className="flex items-center gap-2">- Individual Attention & Care</li>
              </ul>
            }
            colorClass="bg-[var(--color-navy-deep)] text-white"
          />

          <FlipCard
            title="Lower Secondary"
            subtitle="Grades 6 - 8"
            icon={<Microscope className="h-6 w-6 text-secondary" />}
            frontContent="Strengthening core subjects with hands-on activities, projects, and growing responsibility."
            backContent={
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2">- Integrated Science & Tech</li>
                <li className="flex items-center gap-2">- Advanced Math & Social Studies</li>
                <li className="flex items-center gap-2">- Language & Writing Workshops</li>
                <li className="flex items-center gap-2">- Group Projects & Field Trips</li>
              </ul>
            }
            colorClass="bg-[var(--color-navy-deep)] text-white"
          />

          <FlipCard
            title="Secondary Level"
            subtitle="Grades 9 - 10 / SEE"
            icon={<Trophy className="h-6 w-6 text-secondary" />}
            frontContent="Focused, exam-ready preparation across science, mathematics, language, and social studies."
            backContent={
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center gap-2">- Dedicated SEE Prep Classes</li>
                <li className="flex items-center gap-2">- Practical Science & Computer Labs</li>
                <li className="flex items-center gap-2">- Mock Exams & Detailed Feedback</li>
                <li className="flex items-center gap-2">- Career & Stream Counselling</li>
              </ul>
            }
            colorClass="bg-[var(--color-navy-deep)] text-white"
          />
        </div>
      </section>

      {/* =========================  INTERACTIVE PATHWAY EXPLORER  ========================= */}
      <section id="pathways" className="py-20 md:py-28 bg-slate-50 border-t border-b border-slate-100">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow-pill">
              <Sparkles className="h-3.5 w-3.5 text-secondary animate-pulse" />
              Interactive Pathway Explorer
            </span>
            <h2 className="section-title mt-5">Discover Your Journey at NSVM</h2>
            <p className="mt-4 text-slate-600 font-sans leading-relaxed">
              Every child has unique gifts. Select an academic or talent focus below to see how New Saraswati Vidya Mandir shapes student growth with dedicated facilities, courses, and co-curricular programs.
            </p>
          </div>

          {/* Interactive Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 max-w-4xl mx-auto bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-md reveal-up">
            {(Object.keys(PATHWAYS_DATA) as Array<keyof typeof PATHWAYS_DATA>).map((key) => {
              const item = PATHWAYS_DATA[key];
              const isSelected = activePathway === key;
              return (
                <button
                  key={key}
                  onClick={() => setActivePathway(key)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold font-sans text-xs transition-all relative ${
                    isSelected
                      ? "text-white"
                      : "text-slate-600 hover:text-primary hover:bg-slate-50"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activePathwayTab"
                      className="absolute inset-0 bg-primary rounded-xl z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 transition-colors ${isSelected ? "text-secondary" : "text-slate-500"}`}>
                    {item.icon}
                  </span>
                  <span className="relative z-10">{t(item.title.split(" ")[0])} Track</span>
                </button>
              );
            })}
          </div>

          {/* Pathway Details Card with Motion */}
          <div className="reveal-up">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePathway}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl overflow-hidden relative"
              >
              {/* Left Column: Interactive Card */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${PATHWAYS_DATA[activePathway].badgeColor}`}>
                    <Sparkle className="h-3 w-3 animate-spin text-secondary" />
                    Featured Stream
                  </span>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-primary mt-4 leading-tight">
                    {t(PATHWAYS_DATA[activePathway].title)}
                  </h3>
                  <p className="text-slate-500 text-sm mt-3 leading-relaxed font-sans font-medium">
                    {t(PATHWAYS_DATA[activePathway].subtitle)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3.5">
                  <strong className="text-primary text-xs uppercase tracking-widest block font-sans">
                    🎯 Core Focus Area:
                  </strong>
                  <p className="text-slate-600 text-xs leading-relaxed font-sans">
                    {t(PATHWAYS_DATA[activePathway].focus)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <Link href="/apply" className="btn-gold flex-1 justify-center py-3">
                    Enroll in this Track <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/courses" className="btn-ghost px-4 border border-slate-200">
                    Syllabus
                  </Link>
                </div>
              </div>

              {/* Right Column: Grid Details */}
              <div className="lg:col-span-7 space-y-6">
                {/* Subjects */}
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 font-sans mb-3 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-secondary" />
                    Specialized Curriculum & Subjects
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {PATHWAYS_DATA[activePathway].subjects.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:border-secondary/20 transition-all">
                        <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                        <span className="text-xs font-bold text-primary font-sans leading-normal">
                          {t(sub)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facilities & Labs */}
                <div className="grid sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      Learning Environment
                    </h5>
                    <p className="text-slate-600 text-xs leading-relaxed font-sans">
                      {t(PATHWAYS_DATA[activePathway].facilities)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-secondary animate-pulse" />
                      Co-curricular Highlights
                    </h5>
                    <p className="text-slate-600 text-xs leading-relaxed font-sans">
                      {t(PATHWAYS_DATA[activePathway].activities)}
                    </p>
                  </div>
                </div>

                {/* Future Pathways */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3.5 mt-2">
                  <div className="h-8 w-8 rounded-lg bg-primary text-secondary flex items-center justify-center shrink-0">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-primary font-sans">
                      Future Prospects & Board Careers
                    </h6>
                    <p className="text-slate-700 text-xs font-sans mt-1 leading-normal font-semibold">
                      {t(PATHWAYS_DATA[activePathway].future)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </section>

      {/* =========================  A DAY IN THE LIFE (Visual Slider)  ========================= */}
      <section id="daily-rhythm" className="py-20 md:py-24 bg-white overflow-hidden">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="eyebrow-pill">A Day in the Life</span>
            <h2 className="section-title mt-5">Daily Student Rhythm</h2>
            <p className="mt-4 text-slate-600 font-sans text-sm">
              Take a virtual glance at the typical daily schedule of an NSVM learner — balancing rigorous academic blocks, practical research, and creative co-curricular development.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
            {/* Visual Timeline Stepper */}
            <div className="md:col-span-5 space-y-4 stagger">
              {[
                { time: "09:30 AM", title: "Assembly & Discipline", desc: "Our morning routine builds respect, team spirit, and mental readiness with national anthems, prayers, and quick moral check-ins." },
                { time: "10:00 AM", title: "Core Academic Blocks", desc: "Students engage in conceptual math, active language lessons, and theory blocks guided by qualified stream leaders." },
                { time: "01:00 PM", title: "Fellowship Lunch", desc: "Healthy, supervised hot cafeteria lunches provide relaxation and build peer-to-peer relationships." },
                { time: "02:00 PM", title: "Science & Computer Labs", desc: "Hands-on projects, experiments, coding exercises, and multimedia studies in our advanced labs." },
                { time: "04:00 PM", title: "Sports & Club Practice", desc: "Coached drills, houses matches, traditional dancing, art clubs, or debate circles close out the daily path." }
              ].map((item, idx) => (
                <div key={idx} className="relative pl-8 pb-4 border-l-2 border-slate-100 last:pb-0 last:border-l-0 group hover:border-secondary transition-all">
                  {/* Circle Pin */}
                  <div className="absolute left-[-7px] top-1 h-3 w-3 rounded-full bg-slate-200 border-2 border-white group-hover:bg-secondary group-hover:scale-125 transition-all" />
                  
                  <span className="text-[10px] font-black uppercase tracking-wider text-secondary font-sans">
                    {item.time}
                  </span>
                  <h4 className="font-display font-bold text-slate-800 text-sm mt-0.5 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-slate-500 text-xs font-sans mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Visual Media Showcase */}
            <div className="md:col-span-7 reveal-right">
              <div className="relative p-2 bg-gradient-to-br from-amber-100/40 via-blue-100/40 to-slate-200/50 rounded-[2.5rem] border border-slate-200">
                <div className="image-frame hover-zoom rounded-[2rem] shadow-xl overflow-hidden aspect-[4/3]">
                  <ImageWithSkeleton
                    src={ASSETS.classroom}
                    alt="Students studying at New Saraswati School"
                    loading="lazy"
                    decoding="async"
                    aspectRatio="aspect-[4/3]"
                    containerClassName="rounded-[2rem]"
                    className="w-full h-full object-cover"
                    sizes="(max-width: 768px) 100vw, 680px"
                  />
                  {/* Floating Micro Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-primary/95 backdrop-blur-md p-5 rounded-2xl border border-white/10 text-white flex items-center justify-between shadow-2xl">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-secondary font-bold font-sans">Campus Highlights</span>
                      <strong className="text-xs sm:text-sm font-display block mt-1">Nurturing Tomorrow's Leaders Today</strong>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-secondary text-primary flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================  NOTICES + PRINCIPAL  ========================= */}
      <section
        id="notices"
        className="py-20 md:py-28"
        style={{
          background:
            "linear-gradient(180deg, #f5f8fc 0%, #fafbfc 100%)",
        }}
      >
        <div className="container grid lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Notices */}
          <div className="lg:col-span-7">
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <span className="eyebrow-left">Notices & Events</span>
                <h2 className="section-heading mt-4">Latest from the school</h2>
              </div>
              <Link
                href="/notices"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold tracking-wide hover:text-secondary transition-colors"
                style={{ color: "var(--color-navy)" }}
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-3.5 stagger reveal">
              {[
                {
                  day: "12",
                  month: "Jul",
                  tag: "Admissions",
                  title: "Admission open for academic session 2082 BS",
                  desc: "Forms available at the school office. Limited seats across Grade 1 to Grade 9.",
                },
                {
                  day: "28",
                  month: "Jun",
                  tag: "Examination",
                  title: "First-term examination routine published",
                  desc: "Routines for all grades have been shared with class teachers and parents.",
                },
                {
                  day: "05",
                  month: "Jun",
                  tag: "Cultural",
                  title: "Annual cultural programme",
                  desc: "A full day of music, dance, and student performances. Guardians cordially invited.",
                },
                {
                  day: "18",
                  month: "May",
                  tag: "Sports",
                  title: "Inter-house athletics meet results announced",
                  desc: "Congratulations to the winning house for retaining the overall championship.",
                },
              ].map((n) => (
                <div key={n.title} className="notice-row hover-lift">
                  <div className="notice-date">
                    <span className="d-day">{n.day}</span>
                    <span className="d-month">{n.month}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="notice-tag">{n.tag}</span>
                    <h4 className="hover:text-secondary transition-colors duration-200">{n.title}</h4>
                    <p>{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 sm:hidden">
              <Link href="/notices" className="btn-ghost w-full justify-center">
                View all notices <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Principal Preview */}
          <aside className="lg:col-span-5 reveal-right">
            <span className="eyebrow-left">{t("Message / Principal")}</span>
            <h2 className="section-heading mt-4">{t("A word from our Principal")}</h2>

            <div className="soft-card mt-7 p-6 sm:p-8 hover-lift relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-gold" />
              <Quote className="h-8 w-8 text-secondary" />
              <p
                className="mt-4 leading-relaxed text-primary font-medium"
                style={{
                  fontFamily: "var(--font-quote)",
                  fontSize: "clamp(1rem, 0.92rem + 0.3vw, 1.125rem)",
                  lineHeight: 1.65,
                }}
              >
                {t(LEADERSHIP.principal.quote)}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <img
                  src={LEADERSHIP.principal.image}
                  alt={t(LEADERSHIP.principal.name)}
                  loading="lazy"
                  decoding="async"
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover"
                  style={{
                    objectPosition: "center top",
                    boxShadow:
                      "0 0 0 2px white, 0 0 0 4px var(--color-gold), 0 8px 18px -8px rgba(7,28,56,0.30)",
                  }}
                  sizes="56px"
                />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      color: "var(--color-navy)",
                      fontSize: 17,
                      lineHeight: 1.2,
                    }}
                  >
                    {t(LEADERSHIP.principal.name)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--color-gold)",
                      fontWeight: 700,
                      marginTop: 3,
                    }}
                  >
                    {t(LEADERSHIP.principal.role)}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/about" className="btn-ghost w-full justify-center">
                  {t("Read leadership messages")} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* =========================  STATS / ACHIEVEMENTS (Animated Counter)  ========================= */}
      <section id="achievements" className="stats">
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
              {t("Our Achievement")}
            </span>
            <h2 className="section-title text-white mt-5">
              {t("Two decades of community impact")}
            </h2>
            <p
              className="mt-5 mx-auto"
              style={{
                color: "rgba(255,255,255,0.78)",
                fontFamily: "var(--font-sans)",
                fontSize: "1.0625rem",
                lineHeight: 1.65,
                maxWidth: "62ch",
              }}
            >
              {t("Each number is a quiet daily commitment from teachers, students, and guardians, repeated year after year.")}
            </p>
          </div>

          <div className="stats-grid stagger">
            <div className="stat-item hover:scale-105 transition-transform duration-300">
              <div className="stat-icon">
                <Users2 className="h-6 w-6" />
              </div>
              <div className="stat-number">
                <AnimatedCounter value={1300} suffix="+" />
              </div>
              <p>{t("Students Enrolled")}</p>
            </div>

            <div className="stat-item hover:scale-105 transition-transform duration-300">
              <div className="stat-icon">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="stat-number">
                <AnimatedCounter value={50} suffix="+" />
              </div>
              <p>{t("Faculty & Staff")}</p>
            </div>

            <div className="stat-item hover:scale-105 transition-transform duration-300">
              <div className="stat-icon">
                <Award className="h-6 w-6" />
              </div>
              <div className="stat-number">
                <AnimatedCounter value={25} suffix="+" />
              </div>
              <p>{t("Years of Excellence")}</p>
            </div>

            <div className="stat-item hover:scale-105 transition-transform duration-300">
              <div className="stat-icon">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="stat-number">
                <AnimatedCounter value={95} suffix="%" />
              </div>
              <p>{t("SEE Success Rate")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================  GALLERY TEASER  ========================= */}
      <section id="gallery" className="gallery-slider-section">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="eyebrow-pill">Campus Life</span>
            <h2 className="section-title mt-5">A Living Campus</h2>
            <p
              className="mt-5 mx-auto"
              style={{
                color: "var(--brand-slate)",
                fontFamily: "var(--font-sans)",
                fontSize: "1.05rem",
                lineHeight: 1.65,
                maxWidth: "55ch",
              }}
            >
              Glimpses of student life: focused classrooms, cultural celebration,
              and the everyday rhythm of community learning.
            </p>
          </div>
        </div>

        <div className="gallery-slider-wrapper reveal-up">
          <div className="gallery-slider">
            {[
              { img: ASSETS.campus, caption: "School Campus" },
              { img: ASSETS.campusLife, caption: "Student Assembly" },
              { img: ASSETS.classroom, caption: "Classroom Learning" },
              { img: ASSETS.activity, caption: "Student Activity" },
              { img: ASSETS.activity2, caption: "School Programme" },
              { img: ASSETS.activity3, caption: "Campus Moment" },
              { img: ASSETS.event, caption: "Event Memory" },
              // duplicated for seamless loop
              { img: ASSETS.campus, caption: "School Campus" },
              { img: ASSETS.campusLife, caption: "Student Assembly" },
              { img: ASSETS.classroom, caption: "Classroom Learning" },
              { img: ASSETS.activity, caption: "Student Activity" },
              { img: ASSETS.activity2, caption: "School Programme" },
              { img: ASSETS.activity3, caption: "Campus Moment" },
              { img: ASSETS.event, caption: "Event Memory" },
            ].map((s, i) => (
              <div className="gallery-slide" key={i}>
                <ImageWithSkeleton
                  src={s.img}
                  alt={s.caption}
                  loading="lazy"
                  decoding="async"
                  aspectRatio="none"
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.06]"
                  sizes="(max-width: 768px) 280px, 360px"
                />
                <div className="gallery-caption">{s.caption}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================  CTA BAND  ========================= */}
      <section id="admission-cta" className="container py-16 md:py-20">
        <div className="cta-band grid md:grid-cols-12 gap-8 items-center hover-lift relative overflow-hidden reveal-up">
          <div className="md:col-span-8">
            <span
              className="eyebrow-pill"
              style={{
                color: "var(--color-gold-soft)",
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              <CalendarDays className="h-3 w-3 animate-bounce" />
              Admission Open / 2082 BS
            </span>
            <h2
              className="text-white mt-5"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 1.1rem + 1.8vw, 2.5rem)",
                lineHeight: 1.15,
                letterSpacing: "-0.01em",
              }}
            >
              Begin a confident academic journey in BDM-12, Airy, Kanchanpur.
            </h2>
            <p
              className="mt-4 text-white/85 max-w-2xl"
              style={{ fontFamily: "var(--font-sans)", fontSize: "1.0625rem", lineHeight: 1.65 }}
            >
              Visit our campus at {SCHOOL.location}, meet our teachers, and learn
              how New Saraswati Vidya Mandir Secondary School can shape your child's school years with
              discipline, knowledge, and care.
            </p>
          </div>
          <div className="md:col-span-4 flex flex-wrap md:justify-end items-center gap-3">
            <Link href="/contact" className="btn-gold shine">
              Admission Enquiry <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="btn-ghost"
              style={{
                background: "transparent",
                color: "white",
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              About Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
