import { useState } from "react";
import {
  Sparkles,
  GraduationCap,
  Award,
  BookOpen,
  School,
  CheckCircle,
  User,
  Users,
  History,
  FileText,
  ArrowLeft,
  ArrowRight,
  Sparkle,
  ShieldCheck,
  FileSpreadsheet
} from "lucide-react";
import { ASSETS } from "@/const";
import SEO from "@/components/SEO";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { isSupabaseConfigured } from "@/lib/supabase";
import { submitOnlineApplicationToSupabase } from "@/lib/supabaseApi";

export default function Apply() {
  const [form, setForm] = useState({
    fullName: "",
    gender: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
    relation: "",
    prevSchool: "",
    seeGpa: "",
    program: "",
    statement: "",
  });
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!form.fullName || !form.gender || !form.dob || !form.phone || !form.address) {
        toast.error("Please fill in all required personal details.");
        return false;
      }
    } else if (step === 2) {
      if (!form.guardianName || !form.guardianPhone || !form.relation) {
        toast.error("Please fill in all required guardian details.");
        return false;
      }
    } else if (step === 3) {
      if (!form.prevSchool || !form.seeGpa) {
        toast.error("Please fill in all required academic records.");
        return false;
      }
    } else if (step === 4) {
      if (!form.program) {
        toast.error("Please select your program of interest.");
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setActiveStep((prev) => prev - 1);
  };

  // Calculator State
  const [calcScore, setCalcScore] = useState("");
  const [calcType, setCalcType] = useState("gpa");
  const [calcResult, setCalcResult] = useState<null | {
    title: string;
    description: string;
    scholarship: string;
    recommendedProgram: string;
    programValue: string;
    color: string;
  }>(null);

  const handleEvaluate = () => {
    const scoreNum = parseFloat(calcScore);
    if (isNaN(scoreNum) || scoreNum < 0) {
      toast.error("Please enter a valid academic score.");
      return;
    }

    let gpa = scoreNum;
    if (calcType === "percent") {
      if (scoreNum > 100) {
        toast.error("Percentage cannot exceed 100%.");
        return;
      }
      gpa = (scoreNum / 100) * 4.0;
    } else {
      if (scoreNum > 4.0) {
        toast.error("GPA cannot exceed 4.00.");
        return;
      }
    }

    if (gpa >= 3.6) {
      setCalcResult({
        title: "Outstanding Eligibility — Platinum Tier",
        description: "Excellent academic record! You are fully eligible for both our rigorous Science and Management streams in +2. Science offers advanced coaching and practical labs.",
        scholarship: "Highly eligible for 75% to 100% Tuition Fee Waivers based on your school entry test ranking.",
        recommendedProgram: "Grade XI–XII Science Stream",
        programValue: "Grade XI–XII Science Stream",
        color: "text-emerald-700 bg-emerald-50 border-emerald-100",
      });
    } else if (gpa >= 3.0) {
      setCalcResult({
        title: "Excellent Eligibility — Gold Tier",
        description: "Awesome! You are eligible to enroll in +2 Science (requires passing entrance exam) and +2 Management streams. Our faculty will help unlock your full potential.",
        scholarship: "Eligible for 50% to 75% Merit Scholarships & installment facilities.",
        recommendedProgram: "Grade XI–XII Science or Management Stream",
        programValue: "Grade XI–XII Science Stream",
        color: "text-amber-700 bg-amber-50 border-amber-100",
      });
    } else if (gpa >= 2.4) {
      setCalcResult({
        title: "Meritorious Eligibility — Silver Tier",
        description: "Great record! You are highly eligible for the +2 Management stream with specialization in Computer Science, Hotel Management, or Business Studies.",
        scholarship: "Eligible for up to 35% Scholarships based on admissions evaluation and SEE results.",
        recommendedProgram: "Grade XI–XII Management Stream",
        programValue: "Grade XI–XII Management",
        color: "text-blue-700 bg-blue-50 border-blue-100",
      });
    } else if (gpa >= 1.6) {
      setCalcResult({
        title: "Standard Eligibility — General Tier",
        description: "You meet the criteria for our Management stream (Computer Science / Finance majors). Focus is on core business literacy, accounting, and practical commerce.",
        scholarship: "Deserving sports quota, underprivileged support, and flexible installment plans are available.",
        recommendedProgram: "Grade XI–XII Management Stream",
        programValue: "Grade XI–XII Management",
        color: "text-slate-700 bg-slate-50 border-slate-100",
      });
    } else {
      setCalcResult({
        title: "Special Academic Guidance Recommended",
        description: "We warmly recommend a personalized consultation session with our Principal and Stream coordinators to tailor a study track that ensures you grow with confidence.",
        scholarship: "Custom financial aid plans and flexible fee structures are open on a case-by-case basis.",
        recommendedProgram: "Counseling & Prep Plan",
        programValue: "Secondary School (Grade 9 - 10)",
        color: "text-rose-700 bg-rose-50 border-rose-100",
      });
    }

    toast.success("Academic evaluation completed!");
  };

  const handleAutoFill = () => {
    if (!calcResult) return;
    setForm((prev) => ({
      ...prev,
      seeGpa: calcScore,
      program: calcResult.programValue,
    }));
    toast.success("Evaluation details copied into the Application Form below!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (
      !form.fullName ||
      !form.gender ||
      !form.dob ||
      !form.phone ||
      !form.address ||
      !form.guardianName ||
      !form.guardianPhone ||
      !form.relation ||
      !form.prevSchool ||
      !form.seeGpa ||
      !form.program
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      let submitted = false;
      if (isSupabaseConfigured) {
        try {
          await submitOnlineApplicationToSupabase({
            full_name: form.fullName,
            phone: form.phone,
            email: form.email,
            parent_name: form.guardianName,
            address: form.address,
            guardian_name: form.guardianName,
            guardian_phone: form.guardianPhone,
            relation: form.relation,
            prev_school: form.prevSchool,
            see_gpa: form.seeGpa,
            program: form.program,
            statement: form.statement,
          });
          submitted = true;
        } catch (sbErr) {
          console.warn("Supabase application submission failed, falling back to local server:", sbErr);
        }
      }
      
      if (!submitted) {
        const response = await fetch("/api/applications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            submittedAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to submit application");
        }
      }

      toast.success(
        `Application submitted successfully! Thank you, ${form.fullName}. Our admissions team will review your application for ${form.program} and contact you within 3-5 working days.`
      );
      
      // Reset form
      setForm({
        fullName: "",
        gender: "",
        dob: "",
        phone: "",
        email: "",
        address: "",
        guardianName: "",
        guardianPhone: "",
        relation: "",
        prevSchool: "",
        seeGpa: "",
        program: "",
        statement: "",
      });
      setActiveStep(1);
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Online Student Admission Form 2082 B.S. — Apply Online"
        description="Apply online for student admission at New Saraswati Vidya Mandir Secondary School (newsaraswati / NSVM), BDM-12 Airy, Kanchanpur. Enrollment open for Montessori to Grade 12 (+2 Management)."
        keywords="New Saraswati Admission, newsaraswati, newsaraswatividyamandir, Apply New Saraswati Vidya Mandir, NSVM Admission Form Kanchanpur, Online Admission 2082 BS, newsaraswati admission form"
        canonical="/apply"
        pageType="WebPage"
        breadcrumbs={[
          { name: "Home", path: "/" },
          { name: "Online Admission", path: "/apply" },
        ]}
      />
      {/* Hero Banner */}
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
            backgroundImage: `url(${ASSETS.campus})`,
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
            Admissions Open
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
            Apply <span className="text-shimmer" style={{ backgroundSize: "200% 100%" }}>Now</span>
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
            Begin your academic journey at New Saraswati Vidya Mandir Secondary School. Complete the application form below and our admissions team will be in touch.
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

      {/* ==================== INTERACTIVE ELIGIBILITY CALCULATOR ==================== */}
      <section className="container pt-12">
        <div className="soft-card p-6 sm:p-10 border border-slate-100 bg-white shadow-xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-gold" />
          <div className="absolute top-0 right-0 w-36 h-36 bg-secondary/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -translate-x-8 translate-y-8 pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center mb-8">
            <span className="eyebrow-pill">Smart Stream Advisor</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-primary mt-4">
              Academic Eligibility Calculator
            </h2>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              Wondering which academic stream best fits your score or what scholarships you might qualify for? Enter your GPA or Percentage below for instant evaluation.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Input Side */}
            <div className="md:col-span-5 flex flex-col justify-center space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                  Evaluation System
                </label>
                <select
                  value={calcType}
                  onChange={(e) => {
                    setCalcType(e.target.value);
                    setCalcScore("");
                    setCalcResult(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-white cursor-pointer appearance-none"
                >
                  <option value="gpa">SEE GPA (0.00 - 4.00)</option>
                  <option value="percent">Percentage (0% - 100%)</option>
                </select>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                  Enter Your Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={calcType === "gpa" ? "4" : "100"}
                    value={calcScore}
                    onChange={(e) => setCalcScore(e.target.value)}
                    placeholder={calcType === "gpa" ? "e.g. 3.65" : "e.g. 85.5"}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-white"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    {calcType === "gpa" ? "GPA" : "%"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEvaluate}
                className="btn-gold w-full justify-center py-3 rounded-xl shadow-md transition font-bold"
              >
                Evaluate Stream & Scholarships
              </button>
            </div>

            {/* Recommendation Display Side */}
            <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-150 flex flex-col justify-between text-left min-h-[250px] shadow-inner bg-slate-50/20">
              {calcResult ? (
                <div className="h-full flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <span className={`inline-block text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${calcResult.color}`}>
                      {calcResult.title}
                    </span>
                    <h4 className="font-display font-bold text-xl text-primary">
                      Recommended: {calcResult.recommendedProgram}
                    </h4>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      {calcResult.description}
                    </p>
                    <div className="p-3.5 bg-amber-50/40 border border-amber-100/60 rounded-xl">
                      <strong className="text-amber-800 text-xs block mb-1">🎁 Scholarship Advisor:</strong>
                      <p className="text-slate-600 text-xs leading-normal">
                        {calcResult.scholarship}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--brand-blue)] text-white text-[12px] font-bold hover:bg-[var(--brand-blue-deep)] shadow-sm transition active:scale-[0.98]"
                  >
                    Auto-Fill score & course into Form below ↓
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 my-auto">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                    <GraduationCap className="h-8 w-8 text-secondary" />
                  </div>
                  <h4 className="font-display font-bold text-slate-700 text-base">Your Report Awaits</h4>
                  <p className="text-slate-500 text-xs max-w-[280px]">
                    Enter your SEE/Grade card scores on the left and click evaluate to instantly generate your stream advice card.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Form Section */}
      <section className="container py-20 md:py-28">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Admission Highlights */}
          <div className="lg:col-span-4 space-y-8 reveal-left">
            <div className="sticky top-28 space-y-8">
              <div>
                <span className="text-xs font-bold text-secondary tracking-widest uppercase block mb-2">
                  Admissions Open
                </span>
                <h2 className="font-display font-extrabold text-3xl text-primary leading-tight">
                  Admission Highlights
                </h2>
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  Join a community dedicated to academic excellence, leadership development, and character building.
                </p>
              </div>

              {/* Highlight Cards */}
              <div className="space-y-4">
                <div className="soft-card p-5 border border-slate-100 flex items-start gap-4">
                  <div className="p-2.5 bg-primary/5 text-secondary border border-secondary/10 rounded-xl shrink-0">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-primary text-base">Academic Offerings</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Comprehensive courses from Montessori to Grade XII, with NEB Management at Grades XI and XII.
                    </p>
                  </div>
                </div>

                <div className="soft-card p-5 border border-slate-100 flex items-start gap-4">
                  <div className="p-2.5 bg-primary/5 text-secondary border border-secondary/10 rounded-xl shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-primary text-base">Scholarship Opportunities</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Merit-based scholarships, sports quotas, and financial support for deserving students.
                    </p>
                  </div>
                </div>

                <div className="soft-card p-5 border border-slate-100 flex items-start gap-4">
                  <div className="p-2.5 bg-primary/5 text-secondary border border-secondary/10 rounded-xl shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-primary text-base">Modern Facilities</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Fully equipped science laboratories, computer suites, a rich library, and vast playgrounds.
                    </p>
                  </div>
                </div>

                <div className="soft-card p-5 border border-slate-100 flex items-start gap-4">
                  <div className="p-2.5 bg-primary/5 text-secondary border border-secondary/10 rounded-xl shrink-0">
                    <School className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-primary text-base">Dedicated Faculty</h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                      Experienced, caring educators who mentor and guide every student individually.
                    </p>
                  </div>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="soft-card p-6 bg-primary text-white relative overflow-hidden rounded-2xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8" />
                <h4 className="font-display font-bold text-lg text-secondary">Need Assistance?</h4>
                <p className="text-white/80 text-xs mt-2 leading-relaxed">
                  If you have any queries regarding the admission process, feel free to call our helpdesk directly.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-secondary" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-white/60 block">Direct Helpline</span>
                  <span className="text-sm font-bold text-white font-sans">099-525169</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-section Progressive Application Form */}
          <div className="lg:col-span-8">
            <div className="soft-card p-5 sm:p-10 border border-slate-100 relative overflow-hidden bg-white rounded-3xl shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-gold" />

              <div className="mb-6">
                <span className="text-xs font-bold text-secondary tracking-widest uppercase block mb-1">
                  Interactive Enrollment System
                </span>
                <h3 className="font-display font-black text-2xl sm:text-3xl text-primary">
                  Student Application Wizard
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  Complete the quick steps below to submit your digital inquiry sheet directly to our board registry.
                </p>
              </div>

              {/* Progress Stepper Visualizer */}
              <div className="grid grid-cols-4 gap-2 mb-8 pb-4 border-b border-slate-100">
                {[
                  { id: 1, label: "Personal", icon: <User className="h-4 w-4" /> },
                  { id: 2, label: "Guardian", icon: <Users className="h-4 w-4" /> },
                  { id: 3, label: "Academic", icon: <History className="h-4 w-4" /> },
                  { id: 4, label: "Review", icon: <FileText className="h-4 w-4" /> }
                ].map((step) => {
                  const isActive = activeStep === step.id;
                  const isCompleted = activeStep > step.id;
                  return (
                    <div key={step.id} className="flex flex-col items-center text-center space-y-1">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-secondary border-secondary text-primary shadow-sm"
                          : isActive
                            ? "bg-primary border-primary text-white scale-110 shadow-md ring-4 ring-primary/10"
                            : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}>
                        {isCompleted ? <CheckCircle className="h-3.5 w-3.5 stroke-[3px]" /> : step.icon}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-wider font-sans hidden sm:block ${
                        isActive ? "text-primary font-black" : isCompleted ? "text-secondary font-bold" : "text-slate-400"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                  {activeStep === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* 01. Personal Information */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="h-7 w-7 rounded-lg bg-primary/5 text-secondary flex items-center justify-center text-xs font-bold font-sans border border-secondary/10">
                      01
                    </span>
                    <h4 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                      <User className="h-4 w-4 text-secondary" /> Personal Information
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* Gender */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Gender *
                      </label>
                      <select
                        required
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50 cursor-pointer appearance-none"
                      >
                        <option value="" disabled>Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        required
                        value={form.dob}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+977-98XXXXXXXX"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Permanent Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="MNR, Kanchanpur"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>
                  </div>
                </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* 02. Guardian Details */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="h-7 w-7 rounded-lg bg-primary/5 text-secondary flex items-center justify-center text-xs font-bold font-sans border border-secondary/10">
                      02
                    </span>
                    <h4 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                      <Users className="h-4 w-4 text-secondary" /> Guardian Details
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    {/* Guardian Name */}
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Guardian's Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.guardianName}
                        onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                        placeholder="Parent Name"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* Guardian Phone */}
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Guardian's Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={form.guardianPhone}
                        onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                        placeholder="Guardian Phone"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* Relation */}
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Relation *
                      </label>
                      <select
                        required
                        value={form.relation}
                        onChange={(e) => setForm({ ...form, relation: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50 cursor-pointer appearance-none"
                      >
                        <option value="" disabled>Select relation</option>
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Uncle">Uncle</option>
                        <option value="Aunt">Aunt</option>
                        <option value="Legal Guardian">Legal Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* 03. Academic Background */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="h-7 w-7 rounded-lg bg-primary/5 text-secondary flex items-center justify-center text-xs font-bold font-sans border border-secondary/10">
                      03
                    </span>
                    <h4 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                      <History className="h-4 w-4 text-secondary" /> Academic Background
                    </h4>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-5">
                    {/* Previous School */}
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Previous School *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.prevSchool}
                        onChange={(e) => setForm({ ...form, prevSchool: e.target.value })}
                        placeholder="School Name"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* SEE GPA */}
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        SEE GPA / Previous Grade *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.seeGpa}
                        onChange={(e) => setForm({ ...form, seeGpa: e.target.value })}
                        placeholder="e.g., 3.65 or A"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50"
                      />
                    </div>

                    {/* Program of Interest */}
                    <div className="space-y-2 sm:col-span-1">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                        Program of Interest *
                      </label>
                      <select
                        required
                        value={form.program}
                        onChange={(e) => setForm({ ...form, program: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50 cursor-pointer appearance-none"
                      >
                        <option value="" disabled>Select program</option>
                        <option value="Montessori">Montessori</option>
                        <option value="Primary School (Grade 1 - 5)">Primary School (Grade 1 - 5)</option>
                        <option value="Lower Secondary (Grade 6 - 8)">Lower Secondary (Grade 6 - 8)</option>
                        <option value="Secondary School (Grade 9 - 10)">Secondary School (Grade 9 - 10)</option>
                        <option value="Grade XI–XII Science Stream">Grade XI–XII Science Stream</option>
                        <option value="Grade XI–XII Management">Grade XI–XII Management</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
                )}

                {activeStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* 04. Personal Statement */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <span className="h-7 w-7 rounded-lg bg-primary/5 text-secondary flex items-center justify-center text-xs font-bold font-sans border border-secondary/10">
                      04
                    </span>
                    <h4 className="font-display font-bold text-lg text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4 text-secondary" /> Personal Statement
                    </h4>
                  </div>

                  {/* Why do you want to join */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                      Why do you want to join New Saraswati Vidya Mandir?
                    </label>
                    <textarea
                      rows={4}
                      value={form.statement}
                      onChange={(e) => setForm({ ...form, statement: e.target.value })}
                      placeholder="Share your academic goals, interests, and reasons for choosing our school..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-secondary transition font-sans text-sm bg-slate-50/50 resize-none"
                    />
                  </div>
              </motion.div>
              )}
              </AnimatePresence>

              {/* Navigation Buttons Row */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={activeStep === 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous Step
                </button>

                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="btn-gold flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-md text-xs hover:shadow-lg active:scale-[0.98] transition"
                  >
                    Next Step <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-gold flex items-center gap-2 px-7 py-3 rounded-xl font-bold shadow-lg text-xs bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition"
                  >
                    {loading ? (
                      "Submitting Inquiry..."
                    ) : (
                      <>
                        Submit Inquiry <CheckCircle className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
