/*
 * Footer — 4-column gradient navy footer matching the reference site.
 */
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Facebook, Sparkles, Globe, FileCode, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { NAV_ITEMS, SCHOOL } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import InstallAppButton from "./InstallAppButton";

export default function Footer() {
  const { t } = useLanguage();
  const [isClicked, setIsClicked] = useState(false);

  const marqueeItems = [
    {
      label: t("MOTTO"),
      labelColor: "text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] mr-1",
      text: `: ${t(SCHOOL.motto)}`,
      textColor: "text-white font-medium"
    },
    {
      label: "📢 " + t("Admissions Open"),
      labelColor: "text-emerald-400 font-extrabold tracking-wide mr-1",
      text: t("for Montessori to Grade 12!"),
      textColor: "text-slate-100 font-medium"
    },
    {
      label: "🎓 " + t("NEB Plus Two (+2)"),
      labelColor: "text-sky-400 font-black mr-1",
      text: t("Management Stream Admissions Open!"),
      textColor: "text-amber-200 font-bold"
    },
    {
      label: "⚡ " + t("Modern Labs"),
      labelColor: "text-cyan-400 font-bold mr-1",
      text: `: ${t("Smart Classrooms, Well-Equipped Science & Computer Labs!")}`,
      textColor: "text-slate-200 font-normal"
    },
    {
      label: "🏫 " + t("Estd. 2060 B.S."),
      labelColor: "text-rose-400 font-bold mr-1",
      text: ` — ${t("Leading Education with Quality, Confidence & Character.")}`,
      textColor: "text-slate-300 font-normal"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          document.body.classList.add("hide-floating-widgets");
        } else {
          document.body.classList.remove("hide-floating-widgets");
        }
      },
      {
        root: null, // viewport
        threshold: 0.01, // trigger as soon as developer credit/footer bottom area enters screen
      }
    );

    const target =
      document.getElementById("developer-credit-biniyan-container") ||
      document.querySelector(".footer-bottom");

    if (target) {
      observer.observe(target);
    }

    return () => {
      observer.disconnect();
      document.body.classList.remove("hide-floating-widgets");
    };
  }, []);

  const handleCreditClick = () => {
    setIsClicked((prev) => !prev);
  };

  useEffect(() => {
    if (isClicked) {
      const timer = setTimeout(() => {
        setIsClicked(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isClicked]);

  const isVisible = isClicked;

  const onSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.success(t("Subscribed. Thank you for joining our newsletter."));
    (e.currentTarget as HTMLFormElement).reset();
  };

  return (
    <footer className="site-footer" data-no-translate>
      <div className="container relative z-10">
        <div className="footer-main-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="footer-wordmark mb-5">
              <img 
                src={SCHOOL.logo} 
                alt={t("New Saraswati Vidya Mandir")} 
              />
              <div className="footer-brand-copy">
                <h3>{t("New Saraswati Vidya Mandir")}</h3>
                <p>{t("Secondary School")}</p>
                <span>{t("Estd. 2060 B.S.")}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/75 max-w-md mb-6">
              {t("A secondary school in BDM-12, Airy, Kanchanpur offering Montessori to Grade 12 education, with NEB Management stream at Grades XI and XII.")}
            </p>

            {/* Install PWA App Button */}
            <div className="mb-6">
              <InstallAppButton />
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/60 font-bold mb-2">
                {t("Connect with us")}
              </div>
              <div className="flex gap-2">
                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2 footer-explore">
            <h4>{t("Explore")}</h4>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {t(item.label)}
                    </a>
                  ) : (
                    <Link href={item.href}>{t(item.label)}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 footer-quick-links">
            <h4>{t("Quick Links")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/apply"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("Online Admission 2082")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("+2 Management Stream")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/virtual-tour"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("3D Virtual Campus Tour")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/notices"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("Exam Routine & Notices")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/secondary-level-staffs"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("Secondary Faculty")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/school-staffs"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("School Staff Directory")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="inline-flex items-center gap-1.5 text-white/80 hover:text-amber-300 transition-colors group"
                >
                  <span className="text-amber-400/70 group-hover:text-amber-300 font-bold transition-transform group-hover:translate-x-0.5">
                    ›
                  </span>
                  <span>{t("Photo Gallery")}</span>
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 footer-right-stack">
            <div className="grid gap-10 sm:grid-cols-2">
              {/* Contact */}
              <div>
                <h4>{t("Contact")}</h4>
                <ul>
                  <li className="flex items-start gap-2.5 text-white/80">
                    <MapPin className="h-4 w-4 mt-0.5 text-[var(--color-gold-soft)] shrink-0" />
                    <span>
                      {t(SCHOOL.location)}
                      <br />
                      {t(SCHOOL.district)}
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5 text-white/80">
                    <Phone className="h-4 w-4 text-[var(--color-gold-soft)] shrink-0" />
                    <a href={`tel:${SCHOOL.contact.replace(/\s/g, "")}`}>{SCHOOL.contact}</a>
                  </li>
                  <li className="flex items-center gap-2.5 text-white/80">
                    <Mail className="h-4 w-4 text-[var(--color-gold-soft)] shrink-0" />
                    <a href={`mailto:${SCHOOL.email}`} className="break-all">
                      {SCHOOL.email}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Newsletter */}
              <div>
                <h4>{t("Newsletter")}</h4>
                <p className="text-sm text-white/75 leading-relaxed mb-3">
                  {t("Subscribe for school notices, exam routines, and event updates.")}
                </p>
                <form onSubmit={onSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder={t("Your email")}
                    className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-gold-soft)] focus:bg-white/15 transition"
                    style={{ fontFamily: "var(--font-sans)" }}
                  />
                  <button
                    type="submit"
                    className="bg-[var(--gradient-gold)] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: "var(--gradient-gold)",
                      fontFamily: "var(--font-sans)",
                      letterSpacing: "0.12em",
                    }}
                  >
                    {t("Join")}
                  </button>
                </form>
              </div>
            </div>

            <div className="footer-map-panel">
              <div className="footer-map-copy">
                <span className="footer-map-kicker">{t("Visit Campus")}</span>
                <h4>{t("Campus Location")}</h4>
                <p>
                  {t(SCHOOL.location)}, {t(SCHOOL.district)}
                </p>
              </div>
              <div className="footer-map-frame">
                <iframe
                  src={SCHOOL.mapEmbed}
                  title={t("New Saraswati Vidya Mandir map")}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>

        {/* The XML sitemap and robots.txt remain public SEO resources. The
            duplicate link directory is intentionally not rendered in the footer. */}
        {false && <div
          className="footer-seo-directory mt-8 pt-6 border-t border-white/15"
          aria-label="Search engine sitemap and internal links"
        >
          <div className="bg-slate-950/50 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Globe className="w-4 h-4" />
                </div>
                <h5 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-100 font-sans">
                  {t("School Sitemap & Index Directory")}
                </h5>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t("Verified Search Engine Index")}</span>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-amber-400/20 text-amber-300 hover:text-amber-200 border border-amber-400/30 transition-all font-mono text-[10px] font-bold"
                >
                  <FileCode className="w-3 h-3" />
                  <span>sitemap.xml</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
              {/* Category 1: Main Pages */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block mb-2 font-sans">
                  {t("Main Pages & Admissions")}
                </span>
                <ul className="space-y-1.5">
                  <li>
                    <Link href="/" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Home / मुख्य पृष्ठ (New Saraswati)</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>About Us & School History</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/apply" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5 text-amber-200 font-medium">
                      <span className="text-amber-400 font-mono">▸</span>
                      <span>Online Student Admission 2082 B.S.</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Courses & Academic Programs</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/notices" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Notices, Routines & Circulars</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Contact Us & Campus Location</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Category 2: Academic Levels & Campus */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block mb-2 font-sans">
                  {t("Academics & Campus")}
                </span>
                <ul className="space-y-1.5">
                  <li>
                    <Link href="/courses" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>NEB +2 Management Stream (Grades 11 & 12)</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Secondary Level SEE Preparation (Grade 10)</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/courses" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Basic Level & Montessori Wing</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/gallery" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Photo Gallery & Campus Life</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/virtual-tour" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5 text-sky-200">
                      <span className="text-sky-400 font-mono">▸</span>
                      <span>Interactive 3D Virtual Tour 360°</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Category 3: Faculty, Staffs & SEO Resources */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block mb-2 font-sans">
                  {t("Faculty Directory & Crawl Tools")}
                </span>
                <ul className="space-y-1.5">
                  <li>
                    <Link href="/secondary-level-staffs" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Secondary & +2 Management Faculty</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/school-staffs" className="hover:text-white hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>School Staffs & Administration Directory</span>
                    </Link>
                  </li>
                  <li>
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Dynamic XML Sitemap (Google Crawl Index)</span>
                    </a>
                  </li>
                  <li>
                    <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 hover:underline transition-colors flex items-center gap-1.5">
                      <span className="text-amber-400/60 font-mono">▸</span>
                      <span>Robots.txt Crawler Rules</span>
                    </a>
                  </li>
                  <li>
                    <span className="text-slate-400/90 text-[11px] flex items-center gap-1.5">
                      <span className="text-amber-400/40 font-mono">▸</span>
                      <span>BDM-12 Airy, Kanchanpur • Estd. 2060 B.S.</span>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>}

        {/* Scrolling Marquee Section */}
        <div className="mt-4 sm:mt-6 overflow-hidden border-t border-b border-white/10 py-2.5 sm:py-3 bg-slate-950/40 backdrop-blur-sm relative rounded-2xl">
          <style>{`
            @keyframes footerMarquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-footer-marquee {
              display: flex;
              width: max-content;
              animation: footerMarquee 35s linear infinite;
              gap: 3rem;
              padding-right: 3rem;
            }
            .animate-footer-marquee:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="animate-footer-marquee">
            {[...marqueeItems, ...marqueeItems].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-[11px] sm:text-xs tracking-wider whitespace-nowrap font-sans uppercase">
                <span className="text-amber-400 font-bold text-sm">★</span>
                <span className={`${item.labelColor}`}>{item.label}</span>
                <span className={`${item.textColor}`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-bottom border-t border-white/10 pt-4 mt-4 sm:mt-5">
          <div className="flex flex-col items-center justify-center gap-6 w-full text-center">
            {/* Copyright */}
            <div className="text-slate-400 text-sm" id="footer-copyright-text">
              &copy; {new Date().getFullYear()} {t(SCHOOL.name)}. {t("All rights reserved.")}
            </div>

            {/* Developer Credit with pulse/glowing animation */}
            <div className="flex flex-col items-center justify-center gap-3 w-full">
              <motion.div
                id="developer-credit-biniyan-container"
                initial={{ opacity: 0, y: 16, scale: 0.93 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="developer-badge relative inline-flex items-center gap-2.5 px-5 sm:px-6 py-2.5 rounded-full bg-slate-900/80 border border-amber-400/40 transition-all duration-300 group shadow-[0_0_20px_rgba(251,191,36,0.18)] hover:shadow-[0_0_30px_rgba(251,191,36,0.35)] hover:border-amber-400/70 cursor-pointer select-none overflow-hidden"
                onClick={handleCreditClick}
              >
                {/* Glowing border shimmer beam */}
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-400/20 to-amber-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

                {/* Pulsing online indicator dot */}
                <span className="relative flex h-3 w-3 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_#f59e0b]"></span>
                </span>
                
                <span className="text-[11px] sm:text-xs tracking-wider text-slate-200 font-sans flex flex-wrap items-center justify-center gap-1.5">
                  <span className="font-medium text-slate-300">{t("Website Developed By")}</span>{" "}
                  <span 
                    className="font-black bg-gradient-to-r from-amber-300 via-amber-100 to-amber-400 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:to-amber-300 transition-all duration-200 developer-credit-text tracking-wide"
                    id="developer-credit-biniyan"
                  >
                    BINIYAN SAUD
                  </span>{" "}
                  <span className="text-[10px] font-sans font-extrabold bg-amber-400/15 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30 shadow-[0_0_10px_rgba(251,191,36,0.2)] group-hover:bg-amber-400/30 group-hover:border-amber-400/60 transition-all duration-300 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" style={{ animationDuration: "3s" }} />
                    <span>{t("Want to connect?")}</span>
                  </span>
                </span>
              </motion.div>

              {/* Mobile & Desktop Smooth Slide-down Contact Box */}
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ 
                  opacity: isVisible ? 1 : 0, 
                  height: isVisible ? "auto" : 0,
                  scale: isVisible ? 1 : 0.95
                }}
                transition={{ 
                  duration: 0.35, 
                  ease: [0.16, 1, 0.3, 1]
                }}
                className="overflow-hidden flex flex-col items-center justify-center w-full max-w-sm px-2"
              >
                <motion.div
                  initial={{ y: 8 }}
                  animate={{ y: isVisible ? 0 : 8 }}
                  className="p-3.5 rounded-2xl bg-slate-900/90 border border-amber-400/40 shadow-2xl backdrop-blur-xl flex flex-col items-center gap-2 text-center w-full"
                >
                  <p className="text-[11px] text-slate-300 font-medium">
                    {t("Website Developer & Software Engineer")}
                  </p>
                  <motion.a 
                    href="tel:+9779848794397"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-2.5 px-4 text-white text-xs font-bold rounded-xl shadow-xl border flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg, #a61f33 0%, #881337 100%)",
                      borderColor: "#fbbf24",
                      boxShadow: "0 8px 20px -4px rgba(166, 31, 51, 0.5)",
                    }}
                  >
                    <Phone className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
                    <span>{t("Call Developer:")} <span className="font-mono text-amber-300 font-bold ml-1 hover:underline">+977 9848794397</span></span>
                  </motion.a>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
