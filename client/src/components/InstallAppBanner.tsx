import { useEffect, useState } from "react";
import { X, Download, Share, PlusSquare, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { SCHOOL } from "@/const";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 1. Check if already running in standalone mode (app is installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (isStandalone) return;

    // 2. Check localStorage to see if user dismissed it recently (mute for 7 days)
    const dismissedTime = localStorage.getItem("pwa-banner-dismissed");
    if (dismissedTime) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedTime, 10) < sevenDays) {
        return;
      }
    }

    // 3. Detect Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos) {
      setPlatform("ios");
      // Show iOS banner after a 4-second delay for premium UX
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    } else if (isAndroid) {
      setPlatform("android");
    }

    // 4. Capture Android/Chrome native install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the custom banner once we have the install prompt
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  const handleInstallClick = async () => {
    if (platform === "ios") {
      // For iOS, the banner itself acts as the visual guide
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Thank you for installing our school app!");
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      toast.info(
        "To install, tap the three dots in your Chrome toolbar (top right) and select 'Add to Home screen'."
      );
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-fade-up">
      <div className="bg-white rounded-2xl shadow-[0_10px_50px_rgba(7,28,56,0.15)] border border-slate-100 p-5 relative overflow-hidden">
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-gold)]" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-4 items-start pr-6">
          {/* App Icon */}
          <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner">
            <img
              src={SCHOOL.logo}
              alt="School Logo"
              className="h-10 w-10 object-contain rounded-lg"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
              }}
            />
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-[var(--color-navy)] leading-tight">
              New SaraswatiApp
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Install our school app for instant access to notices, schedules, and online admissions.
            </p>
          </div>
        </div>

        {/* Platform Specific Guidance */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {platform === "ios" ? (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed flex flex-col gap-2 font-sans">
              <div className="font-semibold text-[var(--color-navy)] flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-[var(--color-gold)]" />
                How to install on iPhone / iPad:
              </div>
              <ol className="list-decimal pl-4 space-y-1">
                <li>
                  Tap the <strong className="inline-flex items-center gap-0.5 font-bold text-[var(--color-navy)]">Share <Share className="h-3 w-3 inline text-blue-500" /></strong> button in Safari.
                </li>
                <li>
                  Scroll down and select <strong className="inline-flex items-center gap-0.5 font-bold text-[var(--color-navy)]">Add to Home Screen <PlusSquare className="h-3 w-3 inline" /></strong>.
                </li>
              </ol>
            </div>
          ) : (
            <div className="flex gap-2 font-sans">
              <button
                onClick={handleInstallClick}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-navy)] text-white text-xs font-bold hover:bg-[var(--color-navy)]/95 transition active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5" /> Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
