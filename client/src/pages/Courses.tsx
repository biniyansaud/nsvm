import {
  ArrowRight,
  BookOpen,
  Compass,
  GraduationCap,
  Heart,
  HelpCircle,
  Laptop,
  Microscope,
  Sparkles,
  Trophy,
  Users,
  Calculator,
  Percent,
  Award,
  Sparkle,
  CheckCircle,
} from "lucide-react";
import { ASSETS, SCHOOL } from "@/const";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import CourseDetailsModal from "@/components/CourseDetailsModal";
import EnrollmentModal from "@/components/EnrollmentModal";
import ImageWithSkeleton from "@/components/ImageWithSkeleton";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

type CourseLevel =
  | "all"
  | "school"
  | "plus_two"
  | "early"
  | "primary"
  | "lower_sec"
  | "secondary"
  | "higher_sec";

interface CourseItem {
  id: string;
  section: "school" | "plus_two";
  level: string;
  levelName: string;
  title: string;
  age: string;
  grades: string;
  maxStudents: string;
  icon: React.ReactNode;
  image: string;
  desc: string;
  subjects: string[];
  focus: string;
}

export default function Courses() {
  const [filter, setFilter] = useState<CourseLevel>("all");
  const { t } = useLanguage();
  
  // Scholarship Calculator States
  const [calcOpen, setCalcOpen] = useState(false);
  const [levelType, setLevelType] = useState<"school" | "plus_two">("school");
  const [gpaRange, setGpaRange] = useState<"A" | "B" | "C" | "D">("A"); // A: 3.6-4.0, B: 3.2-3.59, C: 2.8-3.19, D: below 2.8
  const [isSports, setIsSports] = useState(false);
  const [isRemote, setIsRemote] = useState(false);
  const [isTopper, setIsTopper] = useState(false);
  const [result, setResult] = useState<{
    waiver: number;
    title: string;
    desc: string;
    monthlyEst: number;
    notes: string;
  } | null>(null);

  const handleCalculate = () => {
    let baseWaiver = 0;
    let title = "Standard Stream Advice";
    let desc = "Standard admission and monthly tuition guidelines apply.";
    let monthlyEst = levelType === "school" ? 2200 : 3500;
    
    // GPA Waiver Calculation
    if (gpaRange === "A") {
      baseWaiver = 50;
      title = "Merit Scholarship Grade A";
      desc = "Excellent academic results. You qualify for an automatic 50% Tuition Fee Waiver.";
    } else if (gpaRange === "B") {
      baseWaiver = 25;
      title = "Merit Scholarship Grade B";
      desc = "Solid academic results. You qualify for an automatic 25% Tuition Fee Waiver.";
    } else if (gpaRange === "C") {
      baseWaiver = 10;
      title = "Academic Support Waiver";
      desc = "Promising results. You qualify for an automatic 10% Tuition Fee Waiver.";
    }
    
    // Topper override
    if (isTopper) {
      baseWaiver = 100;
      title = "Saraswati Board Topper Award";
      desc = "100% full tuition scholarship award for exceptional entrance score performance.";
    } else {
      // Stackable quotas
      if (isSports) {
        baseWaiver = Math.min(baseWaiver + 15, 75);
      }
      if (isRemote) {
        baseWaiver = Math.min(baseWaiver + 10, 75);
      }
    }
    
    // Adjust monthly estimate based on waiver
    const finalWaiver = baseWaiver;
    const discountedMonthly = monthlyEst * (1 - finalWaiver / 100);
    
    setResult({
      waiver: finalWaiver,
      title: title,
      desc: desc,
      monthlyEst: Math.round(discountedMonthly),
      notes: isSports ? "Sports division review required. Ensure co-curricular certificates are attached." : "Maintain good academic standing and 85%+ attendance to continue annual renewal."
    });
  };
  
  // Modal State Management
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  const courses: CourseItem[] = [
    {
      id: "001",
      section: "school",
      level: "early",
      levelName: "Montessori",
      title: "Montessori (Early Childhood)",
      age: "4 and above",
      grades: "Montessori",
      maxStudents: "40 Max",
      icon: <Heart className="h-6 w-6 text-secondary" />,
      image: ASSETS.earlyLearning,
      desc: "Children begin their learning journey in a warm Montessori environment with play-based learning, social habits, motor skill development, and basic language concepts.",
      subjects: [
        "Nepali & English Alphabet Foundations",
        "Fun Numeracy & Shape Identification",
        "Creative Arts, Music & Dance",
        "Social Habits & Emotional Sharing",
        "Sensory & Fine Motor Play Activities",
      ],
      focus: "Play, Social Habits, Fine Motor Skills, Language",
    },
    {
      id: "002",
      section: "school",
      level: "primary",
      levelName: "Primary Level",
      title: "Primary Level (Grades 1 - 5)",
      age: "6 - 10",
      grades: "Class 1 to 5",
      maxStudents: "40 Max",
      icon: <BookOpen className="h-6 w-6 text-secondary" />,
      image: ASSETS.primaryLearning,
      desc: "We provide a highly supportive and engaging environment to primary level students. Our focus is on establishing strong literacy in Nepali and English, core mathematics, environmental curiosity, and moral values that guide everyday behavior.",
      subjects: [
        "Nepali & English Languages",
        "Compulsory Mathematics",
        "Science & Environmental Studies",
        "Social Studies & Local Environment",
        "Creative Arts, Crafts & Physical Ed.",
      ],
      focus: "Reading, Writing, Core Math, Basic Science",
    },
    {
      id: "003",
      section: "school",
      level: "lower_sec",
      levelName: "Lower Secondary Level",
      title: "Lower Secondary Level (Grades 6 - 8)",
      age: "11 - 13",
      grades: "Class 6 to 8",
      maxStudents: "40 Max",
      icon: <Microscope className="h-6 w-6 text-secondary" />,
      image: ASSETS.labLearning,
      desc: "At the Lower Secondary Level, students continue to strengthen their academic foundation. We introduce structured laboratory practices, computer technology, integrated social sciences, and collaborative project work to encourage active enquiry.",
      subjects: [
        "English & Nepali Languages",
        "Compulsory Mathematics",
        "Science & Information Technology",
        "Social Studies & Population Ed.",
        "Moral & Health Education",
        "Occupation, Business & Tech Ed.",
      ],
      focus: "Critical Thinking, Science Labs, Tech Literacy",
    },
    {
      id: "004",
      section: "school",
      level: "secondary",
      levelName: "Secondary Level",
      title: "Secondary Level (Grades 9 - 10 · SEE)",
      age: "14 - 16",
      grades: "Class 9 and 10",
      maxStudents: "40 Max",
      icon: <Trophy className="h-6 w-6 text-secondary" />,
      image: ASSETS.hero,
      desc: "At the Secondary Level, students engage in a more focused and exam-oriented academic program. This track fully prepares students for the Secondary Education Examination (SEE) board with mock testing, extensive lab sessions, and stream counseling.",
      subjects: [
        "Compulsory English & Nepali",
        "Compulsory Mathematics",
        "Compulsory Science & Technology",
        "Compulsory Social Studies",
        "Optional I: Opt. Mathematics",
        "Optional II: Computer Science / Health Ed.",
      ],
      focus: "SEE Preparation, Advanced Science, Career Guidance",
    },
    {
      id: "006",
      section: "plus_two",
      level: "higher_sec",
      levelName: "Higher Secondary (Management)",
      title: "Grade XI–XII Management Program",
      age: "17 - 19",
      grades: "Class 11 and 12",
      maxStudents: "100 Max",
      icon: <Laptop className="h-6 w-6 text-secondary" />,
      image: ASSETS.primaryLearning,
      desc: "The Management stream at Grades XI and XII combines Accounting, Economics, Business Studies, Computer Science, and Social Studies to prepare students for commerce, management, entrepreneurship, and professional studies.",
      subjects: [
        "Compulsory English & Nepali",
        "Compulsory Social Studies / Life Skills",
        "Accountancy",
        "Economics",
        "Computer Science",
        "Business Studies",
        "Entrepreneurship & Project Work",
        "Board Exam Practice",
      ],
      focus: "Accounting, Economics, Business Studies, IT & Entrepreneurship",
    },
  ];

  const plusTwoStreams = [
    {
      code: "01",
      eyebrow: "Management Stream",
      title: "Grade XI–XII Management",
      icon: <Laptop className="h-6 w-6" />,
      summary:
        "NEB Management pathway for Grades 11 and 12, combining accounting, economics, business studies, computer science, and practical project work.",
      subjects: ["Accountancy", "Economics", "Business Studies", "Computer Science", "Social Studies", "English & Nepali"],
      pathways: ["BBA", "BBS", "CA Foundation", "Entrepreneurship", "Banking & IT"],
      image: ASSETS.primaryLearning,
    },
  ];

  const plusTwoStrengths = [
    {
      title: "Subject-Specialist Faculty",
      body: "Experienced +2 teachers guide students through NEB concepts, board preparation, and higher-study planning.",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      title: "Practice-Based Learning",
      body: "Computer work, account projects, presentations, model exams, and regular feedback keep learning active.",
      icon: <Compass className="h-5 w-5" />,
    },
    {
      title: "Pathway Counselling",
      body: "Students receive counselling for commerce, management, entrepreneurship, and professional studies.",
      icon: <Trophy className="h-5 w-5" />,
    },
  ];

  useEffect(() => {
    const syncFilterFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      const targetId = hash === "plus2" ? "plus-two" : hash;

      if (targetId === "school") setFilter("school");
      if (targetId === "plus-two") setFilter("plus_two");

      if (targetId === "school" || targetId === "plus-two") {
        window.setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 0);
      }
    };

    syncFilterFromHash();
    window.addEventListener("hashchange", syncFilterFromHash);
    return () => window.removeEventListener("hashchange", syncFilterFromHash);
  }, []);

  const handleOpenDetails = (course: CourseItem) => {
    setSelectedCourse(course);
    setIsDetailsOpen(true);
  };

  const handleOpenEnroll = (course: CourseItem) => {
    setSelectedCourse(course);
    setIsEnrollOpen(true);
  };

  const filteredCourses = courses.filter((c) => {
    if (filter === "all") return true;
    if (filter === "school" || filter === "plus_two") return c.section === filter;
    return c.level === filter;
  });

  return (
    <>
      <SEO
        title="Academic Programs — Montessori to Grade 12 (+2 Management)"
        description="Explore academic programs at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM) from Montessori to Grade 10 SEE preparation and Grade 11-12 NEB Management in BDM-12 Airy, Kanchanpur."
        keywords="New Saraswati Courses, newsaraswati, newsaraswatividyamandir, New Saraswati Vidya Mandir Programs, +2 Management Kanchanpur, NSVM Montessori Grade 12, SEE Courses New Saraswati"
        canonical="/courses"
        pageType="CollectionPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Academic Programs", path: "/courses" },
        ]}
      />
      {/* Hero */}
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
            backgroundImage: `url(${ASSETS.classroom})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.18,
            mixBlendMode: "overlay",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(197,155,39,0.20) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(30,95,160,0.30) 0%, transparent 55%)",
          }}
        />

        <div className="container relative z-10 py-20 sm:py-24 md:py-32 lg:py-36 text-center">
          <span className="eyebrow-pill">
            <Sparkles className="h-3 w-3 text-secondary animate-pulse" />
            {t("Academic Offerings")}
          </span>
          <h1
            className="text-white mt-6 anim-fade-up font-display font-extrabold"
            style={{
              fontSize: "clamp(2.1rem, 1.4rem + 3.6vw, 4.5rem)",
              lineHeight: 1.06,
              letterSpacing: "-0.01em",
              animationDelay: "80ms",
            }}
          >
            {t("Our Courses")}
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-white/85 anim-fade-up"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(0.98rem, 0.88rem + 0.4vw, 1.125rem)",
              lineHeight: 1.65,
              animationDelay: "160ms",
            }}
          >
            {t("Explore academic pathways from Montessori through school level to NEB Management at Grades XI and XII, built around disciplined study, practical learning, and student-centred guidance.")}
          </p>
        </div>

        {/* Curved bottom transition */}
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

      {/* Course List & Filters */}
      <section id="school" className="courses-pathways-section container scroll-mt-28 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <span className="eyebrow-pill">{t("Academic Programs")}</span>
          <h2 className="section-title mt-5">{t("Educational Pathways")}</h2>
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
            {t("Filter by academic levels to explore our structured curriculum, core subject matrices, and specialized focus areas. Click on any course to view full details and enrollment criteria.")}
          </p>
        </div>

        {/* Dynamic Scholarship Advisor Widget */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="flex justify-center mb-8">
            <button
              onClick={() => {
                setCalcOpen(!calcOpen);
                if(!calcOpen) {
                  // Pre-calc once on open
                  setTimeout(() => handleCalculate(), 50);
                }
              }}
              className="btn-gold flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold font-sans shadow-lg text-xs transition-all active:scale-[0.98]"
            >
              <Calculator className="h-4 w-4 text-secondary animate-pulse" />
              {calcOpen ? "Close Scholarship Advisor" : "Open Interactive Scholarship & Fee Advisor"}
            </button>
          </div>

          <AnimatePresence>
            {calcOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl relative mt-4">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-gold" />
                  
                  <div className="grid md:grid-cols-12 gap-8 items-start">
                    {/* Calculator Form Inputs */}
                    <div className="md:col-span-7 space-y-6">
                      <div>
                        <h3 className="font-display font-black text-xl text-primary flex items-center gap-2">
                          <Percent className="h-5 w-5 text-secondary" />
                          Scholarship & Eligibility Estimator
                        </h3>
                        <p className="text-slate-500 text-xs font-sans mt-1">
                          Our board provides generous waivers based on academic results, sports performance, and regional representations. Select your targets below:
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Stream Selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans block">
                            Target Level
                          </label>
                          <select
                            value={levelType}
                            onChange={(e) => setLevelType(e.target.value as "school" | "plus_two")}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-sans bg-slate-50 focus:outline-none focus:border-secondary cursor-pointer font-bold"
                          >
                            <option value="school">School (Montessori - Grade 10)</option>
                            <option value="plus_two">Higher Secondary (+2 Management)</option>
                          </select>
                        </div>

                        {/* GPA / Score Selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans block">
                            Academic Score Range
                          </label>
                          <select
                            value={gpaRange}
                            onChange={(e) => setGpaRange(e.target.value as "A" | "B" | "C" | "D")}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-sans bg-slate-50 focus:outline-none focus:border-secondary cursor-pointer font-bold"
                          >
                            <option value="A">Excellent (GPA 3.60 - 4.00 / 90%+)</option>
                            <option value="B">Very Good (GPA 3.20 - 3.59 / 80%+)</option>
                            <option value="C">Good (GPA 2.80 - 3.19 / 70%+)</option>
                            <option value="D">Passing (GPA below 2.80 / below 70%)</option>
                          </select>
                        </div>
                      </div>

                      {/* Quota Checkboxes */}
                      <div className="space-y-3.5 pt-2">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans block">
                          Additional Scholarship Criteria
                        </label>
                        <div className="grid sm:grid-cols-3 gap-3">
                          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isSports}
                              onChange={(e) => setIsSports(e.target.checked)}
                              className="accent-secondary h-4 w-4"
                            />
                            <span className="text-[11px] font-bold text-slate-700 font-sans">Sports Quota</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isRemote}
                              onChange={(e) => setIsRemote(e.target.checked)}
                              className="accent-secondary h-4 w-4"
                            />
                            <span className="text-[11px] font-bold text-slate-700 font-sans">Remote Area</span>
                          </label>

                          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isTopper}
                              onChange={(e) => setIsTopper(e.target.checked)}
                              className="accent-secondary h-4 w-4"
                            />
                            <span className="text-[11px] font-bold text-slate-700 font-sans">Entrance Topper</span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={handleCalculate}
                        className="btn-cta w-full justify-center py-3.5 bg-primary text-white font-bold"
                      >
                        Calculate Advisor Report <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Result Card */}
                    <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-6 flex flex-col justify-between min-h-[300px]">
                      {result ? (
                        <div className="space-y-5 h-full flex flex-col justify-between">
                          <div className="space-y-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                              <Award className="h-3.5 w-3.5" />
                              Waiver Approved
                            </span>
                            <h4 className="font-display font-black text-lg text-primary">
                              {result.title}
                            </h4>
                            <p className="text-slate-500 text-xs font-sans leading-relaxed">
                              {result.desc}
                            </p>
                          </div>

                          <div className="p-4 bg-white border border-slate-150/60 rounded-xl space-y-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                              Estimated Monthly Tuition Cost
                            </span>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-black text-primary font-display">Rs. {result.monthlyEst}</span>
                              <span className="text-xs text-slate-400">/ month</span>
                            </div>
                            {result.waiver > 0 && (
                              <span className="text-[10px] text-emerald-600 font-bold font-sans block pt-1">
                                Saved Rs. {Math.round((levelType === "school" ? 2200 : 3500) * (result.waiver / 100))} (Waiver: {result.waiver}%)
                              </span>
                            )}
                          </div>

                          <p className="text-[10px] text-slate-400 font-sans italic leading-relaxed">
                            * {result.notes}
                          </p>

                          <Link
                            href="/apply"
                            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary text-primary text-xs font-bold hover:bg-secondary-hover shadow-md transition active:scale-[0.98]"
                          >
                            Apply online with Scholarship <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 my-auto">
                          <div className="h-12 w-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-secondary">
                            <Sparkle className="h-6 w-6 animate-spin" />
                          </div>
                          <h4 className="font-display font-bold text-slate-700 text-sm">Calculate Waiver Eligibility</h4>
                          <p className="text-slate-400 text-xs font-sans max-w-[240px]">
                            Adjust parameters on the left and hit calculate to generate your custom fee assessment block.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Navigation */}
        <div className="flex flex-nowrap sm:flex-wrap items-center justify-start sm:justify-center gap-2 mb-10 sm:mb-14 border-b border-slate-200/60 pb-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: "all", label: "All Levels" },
            { id: "school", label: "School" },
            { id: "plus_two", label: "+2" },
            { id: "early", label: "Early Childhood" },
            { id: "primary", label: "Primary" },
            { id: "lower_sec", label: "Lower Secondary" },
            { id: "secondary", label: "Secondary" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as CourseLevel)}
              data-active={filter === tab.id}
              className="subtab"
            >
              <span className="subtab-dot" />
              {t(tab.label)}
            </button>
          ))}
        </div>

        {(filter === "all" || filter === "plus_two") && (
          <div id="plus-two" className="plus-two-feature scroll-mt-28 mb-14 rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-900/5 overflow-hidden">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
              <div
                className="plus-two-feature-panel relative min-h-[360px] p-7 sm:p-10 lg:p-12 text-white"
                style={{ background: "linear-gradient(135deg, #071c38 0%, #0f4c5c 58%, #c59b27 140%)" }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-20 mix-blend-overlay"
                  style={{
                    backgroundImage: `url(${ASSETS.campus})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
                <div className="relative z-10 flex h-full flex-col justify-between gap-10">
                  <div>
                    <span className="eyebrow-pill bg-white/10 text-white border-white/20">
                      {t("Grade XI–XII Management")}
                    </span>
                    <h3 className="mt-6 font-display text-[clamp(2rem,1.4rem+2.1vw,3.5rem)] font-black leading-[1.04]">
                      {t("Management stream at Grades 11 and 12.")}
                    </h3>
                    <p className="mt-6 max-w-xl text-white/84 leading-8">
                      {t("Grades XI and XII follow the NEB Management curriculum with accounting, economics, business studies, and computer science.")}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "1", label: "Stream" },
                      { value: "100", label: "Seats Each" },
                      { value: "NEB", label: "Curriculum" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                        <p className="text-2xl font-black">{stat.value}</p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                          {t(stat.label)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="plus-two-streams flex h-full flex-col p-5 sm:p-7 lg:p-8">
                <div className="grid gap-4">
                  {plusTwoStreams.map((stream) => (
                    <article key={stream.title} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 sm:p-6 hover-lift">
                      <div className="grid gap-5 md:grid-cols-[150px_1fr]">
                        <div className="relative overflow-hidden rounded-2xl bg-white h-40 md:h-full">
                          <ImageWithSkeleton
                            src={stream.image}
                            alt={stream.title}
                            loading="lazy"
                            decoding="async"
                            aspectRatio="none"
                            containerClassName="h-full w-full"
                            className="h-full w-full object-cover"
                            sizes="(max-width: 768px) 100vw, 150px"
                          />
                          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-primary z-10">
                            {stream.code}
                          </span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                              {stream.icon}
                            </span>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-secondary">
                                {t(stream.eyebrow)}
                              </p>
                              <h4 className="font-display text-2xl font-black text-[var(--color-navy)]">
                                {t(stream.title)}
                              </h4>
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-7 text-slate-600">{t(stream.summary)}</p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                {t("Subject Cluster")}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {stream.subjects.slice(0, 4).map((subject) => (
                                  <span key={subject} className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-600">
                                    {t(subject)}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                {t("Pathways")}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {stream.pathways.slice(0, 4).map((pathway) => (
                                  <span key={pathway} className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                                    {t(pathway)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle className="h-4 w-4 text-secondary" />
                      <p className="text-[10px] font-black uppercase tracking-[0.14em]">
                        {t("Programme at a glance")}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {t("Regular model exams, project work, computer practice, and individual academic feedback throughout both years.")}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-primary p-5 text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-secondary">
                      {t("Admissions")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      {t("Talk with our admissions team about eligibility, seats, scholarships, and the application process.")}
                    </p>
                    <Link href="/apply" className="mt-4 inline-flex items-center gap-1.5 text-xs font-black text-secondary hover:text-white transition-colors">
                      {t("Start your application")} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-100 bg-[var(--color-cream)] p-5 sm:grid-cols-3 sm:p-7">
              {plusTwoStrengths.map((item) => (
                <div key={item.title} className="rounded-2xl bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    {item.icon}
                  </span>
                  <h4 className="mt-4 font-display text-lg font-black text-[var(--color-navy)]">
                    {t(item.title)}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(item.body)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Cards Grid */}
        <div className="space-y-8 md:space-y-12">
          {filteredCourses.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.4 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`course-curriculum-card grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-12 items-center reveal cursor-pointer shadow-sm hover:shadow-xl p-5 sm:p-7 rounded-[24px] bg-white transition-all duration-300 ${
                idx % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image Frame */}
              <div
                className={`lg:col-span-5 ${
                  idx % 2 === 1 ? "lg:order-2" : "lg:order-1"
                }`}
              >
                <div className="relative group cursor-pointer" onClick={() => handleOpenDetails(c)}>
                  <div className="image-frame hover-zoom shadow-xl">
                    <ImageWithSkeleton
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      decoding="async"
                      aspectRatio="aspect-[4/3]"
                      className="w-full h-full object-cover"
                      sizes="(max-width: 1024px) 100vw, 480px"
                    />
                  </div>
                  {/* Absolute Badge */}
                  <div
                    className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-white font-bold text-[10px] sm:text-xs shadow-lg flex flex-col items-center justify-center"
                    style={{ background: "var(--gradient-gold)" }}
                  >
                    <span className="opacity-75 uppercase tracking-widest text-[8px] sm:text-[9px]">{t("Capacity")}</span>
                    <span className="text-xs sm:text-sm font-extrabold mt-0.5">{t(c.maxStudents)}</span>
                  </div>
                </div>
              </div>

              {/* Course Info */}
              <div
                className={`lg:col-span-7 space-y-5 ${
                  idx % 2 === 1 ? "lg:order-1" : "lg:order-2"
                }`}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/5 text-secondary border border-secondary/10 flex items-center justify-center">
                    {c.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-secondary font-sans block">
                      {t("Code")} {c.id} · {t(c.levelName)}
                    </span>
                    <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-primary">
                      {c.section === "plus_two" ? t("+2 Section") : t("School Section")}
                    </span>
                    <span className="text-xs text-slate-400 font-sans block mt-0.5">
                      {t("Target Age:")} {t(c.age)} | {t(c.grades)}
                    </span>
                  </div>
                </div>

                <h3
                  className="font-display font-extrabold text-primary cursor-pointer hover:text-secondary transition-colors duration-200"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)",
                    lineHeight: 1.15,
                  }}
                  onClick={() => handleOpenDetails(c)}
                >
                  {t(c.title)}
                </h3>

                <p
                  className="text-slate-600 leading-relaxed text-[15px]"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {t(c.desc)}
                </p>

                {/* Subject Matrices & Focus Grid */}
                <div className="course-detail-grid grid sm:grid-cols-2 gap-4 pt-5 border-t border-slate-200/70">
                  {/* Subject List */}
                  <div className="course-info-panel">
                    <h4
                      className="text-xs font-bold uppercase tracking-wider text-primary font-sans flex items-center gap-1.5"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-secondary" />
                      {t("Core Subject Matrix")}
                    </h4>
                    <ul className="mt-4 space-y-2.5 text-xs text-slate-600 font-sans">
                      {c.subjects.slice(0, 4).map((s) => (
                        <li key={s} className="course-subject-row">
                          <span className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                          {t(s)}
                        </li>
                      ))}
                      {c.subjects.length > 4 && (
                        <li className="text-secondary font-bold pl-3.5 mt-1 cursor-pointer hover:underline" onClick={() => handleOpenDetails(c)}>
                          + {c.subjects.length - 4} {t("more subjects")}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Core Focus Area */}
                  <div className="course-info-panel space-y-4">
                    <div>
                      <h4
                        className="text-xs font-bold uppercase tracking-wider text-primary font-sans flex items-center gap-1.5"
                      >
                        <Compass className="h-3.5 w-3.5 text-secondary animate-spin-slow" />
                        {t("Core Focus Area")}
                      </h4>
                      <p className="mt-2.5 text-xs text-slate-500 font-sans leading-relaxed">
                        {t(c.focus)}
                      </p>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        onClick={() => handleOpenEnroll(c)}
                        className="btn-gold shine text-xs px-4 py-2.5 rounded-lg"
                      >
                        {t("Enroll Now")}
                      </button>
                      <button
                        onClick={() => handleOpenDetails(c)}
                        className="btn-ghost text-xs px-4 py-2.5 rounded-lg border border-slate-200 hover:border-primary"
                      >
                        {t("View Details")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* School and +2 Overview */}
      <section className="container pb-12 md:pb-16">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="soft-card p-6 sm:p-8 hover-lift">
            <span className="eyebrow-pill">{t("School Section")}</span>
            <h3 className="mt-5 font-display text-2xl font-black text-[var(--color-navy)]">
              {t("Montessori to Grade 12")}
            </h3>
            <p className="mt-4 leading-8 text-[var(--muted-foreground)]">
              {t("The school section builds literacy, numeracy, science curiosity, technology habits, moral values, and SEE readiness from Montessori through Grade 12.")}
            </p>
          </div>
          <div className="soft-card p-6 sm:p-8 hover-lift">
            <span className="eyebrow-pill">{t("+2 Section")}</span>
            <h3 className="mt-5 font-display text-2xl font-black text-[var(--color-navy)]">
              {t("Management at Grades XI–XII")}
            </h3>
            <p className="mt-4 leading-8 text-[var(--muted-foreground)]">
              {t("Grades XI and XII follow the NEB Management curriculum with subject-specialist faculty, model examinations, counselling, and preparation for commerce and management studies.")}
            </p>
          </div>
        </div>
      </section>

      {/* CDC Standard Banner */}
      <section className="container py-12 md:py-16">
        <div className="cta-band grid md:grid-cols-12 gap-8 items-center hover-lift relative overflow-hidden">
          <div className="md:col-span-8">
            <span
              className="eyebrow-pill"
              style={{
                color: "var(--color-gold-soft)",
                background: "rgba(255,255,255,0.08)",
                borderColor: "rgba(255,255,255,0.18)",
              }}
            >
              {t("Curriculum Development Centre (CDC) Standards")}
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
              {t("Aligned with National Education Standards")}
            </h2>
            <p
              className="mt-4 text-white/85 max-w-2xl"
              style={{ fontFamily: "var(--font-sans)", fontSize: "1.0625rem", lineHeight: 1.65 }}
            >
            {t("NSVM follows national curriculum and NEB requirements, combining them with IT exposure, counselling, extra tutorials, sports, and regular evaluation so students are ready for board examinations and higher studies.")}
            </p>
          </div>
          <div className="md:col-span-4 flex flex-wrap md:justify-end items-center gap-3">
            <Link href="/contact" className="btn-gold shine">
              {t("Contact Admissions")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Course Details Modal */}
      <CourseDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        course={selectedCourse}
      />

      {/* Enrollment Inquiry Modal */}
      <EnrollmentModal
        isOpen={isEnrollOpen}
        onClose={() => setIsEnrollOpen(false)}
        course={selectedCourse}
      />
    </>
  );
}
