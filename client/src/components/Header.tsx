/*
 * Header — sticky navbar matching avnss.edu.np visuals + wpa-edu-np.vercel.app navigation style.
 * - Clean compact logo lockup
 * - Clean nav links with gradient underline (wpa style)
 * - Apply Now (gradient-pill CTA)
 * - Full-page left-sliding mobile sidebar (avnss style) with icons, staggered animations, gradient header
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import {
  Menu,
  X,
  ArrowRight,
  Home,
  Info,
  BookOpen,
  Camera,
  Bell,
  Phone,
  Download,
  Check,
  ChevronDown,
  ExternalLink,
  Users,
  TrendingUp,
  Compass,
} from "lucide-react";
import { SCHOOL, NAV_ITEMS } from "@/const";
import { getAssetUrl } from "@/lib/assets";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";
import { sendVisitorIpToDiscord } from "@/lib/discordWebhook";
import { ImagePreloadManager } from "@/lib/imagePreloadManager";
import { useScrollSpy } from "@/hooks/useScrollSpy";

const HOME_SECTION_IDS = [
  "hero",
  "why-us",
  "programs",
  "pathways",
  "daily-rhythm",
  "notices",
  "achievements",
  "gallery",
  "admission-cta",
];

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-5 w-5" />,
  Info: <Info className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Camera: <Camera className="h-5 w-5" />,
  Bell: <Bell className="h-5 w-5" />,
  Phone: <Phone className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  ExternalLink: <ExternalLink className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  Compass: <Compass className="h-5 w-5" />,
};

const NAV_LOGO = SCHOOL.logo || getAssetUrl("/images/branding/school-logo.jpg");

export default function Header() {
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const { t } = useLanguage();
  const activeSection = useScrollSpy(HOME_SECTION_IDS, 160);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // Prevent background scroll and contain scroll bounce when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "contain";
      document.documentElement.style.overscrollBehavior = "contain";
    } else {
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.overscrollBehavior = "";
      setExpandedMobileItem(null);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.overscrollBehavior = "";
    };
  }, [open]);

  const handleApplyClick = async () => {
    setOpen(false);
    await sendVisitorIpToDiscord();
    setLocation("/apply");
  };

  const isActive = (href: string) => {
    if (href === "#") return false;
    const path = href.split("#")[0];
    const hash = href.split("#")[1];

    if (location === "/" && activeSection) {
      if (hash && hash === activeSection) return true;
      if (href === "/" && (activeSection === "hero" || activeSection === "why-us" || activeSection === "pathways" || activeSection === "daily-rhythm")) {
        return true;
      }
      if (href === "/courses" && activeSection === "programs") return true;
      if (href === "/notices" && activeSection === "notices") return true;
      if (href === "/gallery" && activeSection === "gallery") return true;
    }

    return path === "/" ? location === "/" : location.startsWith(path);
  };

  const mobileNavigation = (
    <>
      <div
        className={`mobile-sidebar-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`mobile-sidebar no-scrollbar ${open ? "open" : ""}`} aria-label={t("Mobile navigation")}>
        {/* Gradient Header */}
        <div className="sidebar-header">
          <div className="flex items-center gap-3.5 min-w-0">
            <span
              className="logo-container shrink-0 flex items-center justify-center rounded-full bg-white/20 p-0.5 border border-white/30"
              style={{ width: 40, height: 40 }}
            >
              <img
                src={NAV_LOGO}
                alt="School crest"
                className="w-8 h-8 rounded-full bg-white object-contain p-0.5"
              />
            </span>
            <div className="leading-tight min-w-0 flex-1">
              <div
                className="font-extrabold text-[15px] text-white truncate"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t("New Saraswati Vidya Mandir")}
              </div>
              <div className="text-[9px] font-bold tracking-widest uppercase text-amber-200/90 mt-0.5">
                {t("Secondary School")}
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label={t("Close navigation")}
            className="sidebar-close-btn flex items-center justify-center shrink-0"
          >
            <X className="h-5 w-5 shrink-0" />
          </button>
        </div>

        <div className="sidebar-body no-scrollbar">
          <ul className="sidebar-nav">
            {NAV_ITEMS.map((item, index) => (
              <li
                key={item.href}
                style={{ transitionDelay: `${open ? (index + 1) * 40 : 0}ms` }}
                className={`transition-all duration-300 ease-out transform ${
                  open ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
                }`}
              >
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="sidebar-nav-link transition-all duration-200 ease-out hover:translate-x-1.5 active:scale-[0.98]"
                  >
                    <span className="sidebar-nav-icon">
                      {iconMap[item.icon] || <Home className="h-5 w-5" />}
                    </span>
                    <span className="flex-1 text-left">{t(item.label)}</span>
                  </a>
                ) : (
                  <>
                    {item.children?.length ? (
                      <button
                        type="button"
                        className={`sidebar-nav-link sidebar-nav-parent transition-all duration-200 ease-out hover:translate-x-1.5 active:scale-[0.98] ${
                          item.children.some((child) => isActive(child.href)) ? "active" : ""
                        }`}
                        aria-expanded={expandedMobileItem === item.href}
                        onClick={() =>
                          setExpandedMobileItem((current) =>
                            current === item.href ? null : item.href,
                          )
                        }
                      >
                        <span className="sidebar-nav-icon">
                          {iconMap[item.icon] || <Home className="h-5 w-5" />}
                        </span>
                        <span className="flex-1 text-left">{t(item.label)}</span>
                        <ChevronDown
                          className={`sidebar-nav-caret h-4 w-4 text-current opacity-70 transition-transform duration-200 ${
                            expandedMobileItem === item.href ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`sidebar-nav-link transition-all duration-200 ease-out hover:translate-x-1.5 active:scale-[0.98] ${
                          isActive(item.href) ? "active" : ""
                        }`}
                      >
                        <span className="sidebar-nav-icon">
                          {iconMap[item.icon] || <Home className="h-5 w-5" />}
                        </span>
                        <span className="flex-1 text-left">{t(item.label)}</span>
                      </Link>
                    )}
                    {item.children?.length && expandedMobileItem === item.href ? (
                      <div className="sidebar-subnav transition-all duration-300 ease-out animate-in fade-in-50 slide-in-from-left-2">
                        {item.children.map((child, childIdx) =>
                          child.external ? (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setOpen(false)}
                              style={{ transitionDelay: `${childIdx * 30}ms` }}
                              className={`sidebar-subnav-link transition-all duration-200 ease-out hover:translate-x-1.5 active:scale-[0.98] ${
                                isActive(child.href) ? "active" : ""
                              }`}
                            >
                              {t(child.label)}
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              style={{ transitionDelay: `${childIdx * 30}ms` }}
                              className={`sidebar-subnav-link transition-all duration-200 ease-out hover:translate-x-1.5 active:scale-[0.98] ${
                                isActive(child.href) ? "active" : ""
                              }`}
                            >
                              {t(child.label)}
                            </Link>
                          ),
                        )}
                      </div>
                    ) : null}
                  </>
                )}
              </li>
            ))}
          </ul>

          <div className="mobile-sidebar-actions">
            {isInstalled ? (
              <div className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[12px] font-bold shadow-xs">
                <Check className="h-4 w-4 text-emerald-600" /> {t("App Installed")}
              </div>
            ) : canInstall ? (
              <button
                onClick={async () => {
                  await promptInstall();
                  setOpen(false);
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[12px] font-bold hover:from-amber-600 hover:to-amber-700 shadow-sm active:scale-[0.98] transition-all duration-200"
              >
                <Download className="h-4 w-4" /> {t("Download")}
              </button>
            ) : null}
            <button
              onClick={handleApplyClick}
              className="btn-cta w-full justify-center py-3 text-[12px] font-bold tracking-wider"
            >
              {t("Apply Now")} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <header
      data-no-translate
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/96 backdrop-blur-md shadow-[0_4px_30px_rgba(7,28,56,0.08)] py-2"
          : "bg-white py-3"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-8">
        {/* Brand */}
        <div className="brand-lockup flex items-center gap-2 sm:gap-3 group navbar-brand-hover min-w-0 flex-1 sm:flex-none">
          <Link
            href="/"
            className="logo-container shrink-0 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            aria-label={t("New Saraswati Vidya Mandir home")}
            title={t("Go to home page")}
          >
            <img 
              src={NAV_LOGO} 
              alt="School crest" 
              style={{ borderRadius: "50%", objectFit: "cover", width: 38, height: 38 }}
            />
          </Link>
          <Link
            href="/"
            aria-label={t("New Saraswati Vidya Mandir home")}
            className="min-w-0 no-underline"
          >
          <div className="hidden sm:flex flex-col leading-tight">
            <span
              className="font-display font-extrabold tracking-wide text-[var(--color-navy)] text-[18px] lg:text-[22px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("New Saraswati Vidya Mandir")}
            </span>
            <span className="text-[10.5px] lg:text-[11.5px] font-bold tracking-[0.18em] text-[var(--color-gold-deep)] uppercase">
              {t("Secondary School")}
            </span>
          </div>
          <div className="sm:hidden flex min-w-0 flex-col leading-tight">
            <span
              className="font-extrabold text-[var(--color-navy)] text-[12.5px] tracking-wide whitespace-nowrap"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("New Saraswati Vidya Mandir")}
            </span>
            <span className="text-[8px] font-bold tracking-[0.12em] text-[var(--color-gold-deep)] uppercase mt-0.5 whitespace-nowrap">
              {t("Secondary School")}
            </span>
          </div>
          </Link>
        </div>

        {/* Right side: Desktop nav + CTA */}
        <div className="hidden lg:flex items-center gap-5 shrink-0">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                !item.external &&
                (isActive(item.href) ||
                  item.children?.some((child) => isActive(child.href)));

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="nav-link"
                    data-active="false"
                  >
                    {t(item.label)}
                  </a>
                );
              }

              if (item.children?.length) {
                return (
                  <div key={item.href} className="relative group">
                    <button
                      type="button"
                      className="nav-link gap-1.5"
                      data-active={active ? "true" : "false"}
                      onMouseEnter={() => ImagePreloadManager.preloadRouteAssets(item.href.split('#')[0])}
                      onFocus={() => ImagePreloadManager.preloadRouteAssets(item.href.split('#')[0])}
                    >
                      {t(item.label)}
                      <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                    </button>
                    <div className="absolute left-0 top-full pt-3 opacity-0 pointer-events-none translate-y-1 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0 transition-all duration-200">
                      <div className="min-w-[230px] rounded-xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10">
                        {item.children.map((child) =>
                          child.external ? (
                            <a
                              key={child.href}
                              href={child.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-4 py-2.5 text-[12px] font-extrabold tracking-[0.08em] text-[var(--color-navy-darker)] hover:bg-slate-50 hover:text-[var(--color-navy)]"
                            >
                              {t(child.label)}
                            </a>
                          ) : (
                            <Link
                              key={child.href}
                              href={child.href}
                              className="block px-4 py-2.5 text-[12px] font-extrabold tracking-[0.08em] text-[var(--color-navy-darker)] hover:bg-slate-50 hover:text-[var(--color-navy)]"
                              onMouseEnter={() => ImagePreloadManager.preloadRouteAssets(child.href.split('#')[0])}
                              onFocus={() => ImagePreloadManager.preloadRouteAssets(child.href.split('#')[0])}
                            >
                              {t(child.label)}
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="nav-link"
                  data-active={active ? "true" : "false"}
                  onMouseEnter={() => ImagePreloadManager.preloadRouteAssets(item.href.split('#')[0])}
                  onFocus={() => ImagePreloadManager.preloadRouteAssets(item.href.split('#')[0])}
                >
                  {t(item.label)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {canInstall && !isInstalled && (
              <button
                onClick={async () => {
                  await promptInstall();
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-[12px] font-bold text-amber-900 shadow-xs transition active:scale-95"
                title="Install School App"
              >
                <Download className="h-3.5 w-3.5 text-amber-700" />
                <span>{t("App")}</span>
              </button>
            )}

            <Link
              href="/apply"
              className="btn-cta no-underline"
              onMouseEnter={() => ImagePreloadManager.preloadRouteAssets("/apply")}
              onFocus={() => ImagePreloadManager.preloadRouteAssets("/apply")}
              onClick={() => {
                void sendVisitorIpToDiscord();
              }}
            >
              {t("Apply Now")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(true)}
          aria-label={t("Open navigation")}
          className="lg:hidden inline-flex h-16 w-16 items-center justify-center rounded-xl text-[var(--color-navy)] border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm hover:shadow-md transition shrink-0"
          style={{ minWidth: 64, minHeight: 64 }}
        >
          <Menu style={{ width: 36, height: 36 }} className="!h-auto !w-auto" />
        </button>
      </div>

      {portalReady ? createPortal(mobileNavigation, document.body) : mobileNavigation}
    </header>
  );
}
