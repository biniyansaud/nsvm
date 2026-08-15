import { Download, Monitor, Smartphone, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";

export default function InstallAppButton() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const { t } = useLanguage();

  if (isInstalled) {
    return (
      <div
        data-no-translate
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-xs font-bold font-sans"
      >
        <Check className="h-4 w-4" /> {t("App Installed")}
      </div>
    );
  }

  if (!canInstall) {
    return null;
  }

  return (
    <button
      data-no-translate
      onClick={promptInstall}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98] transition-all duration-300 font-sans text-xs font-bold border border-primary/10"
    >
      <Download className="h-4 w-4 animate-bounce" />
      {t("Download School App")}
      <span className="flex items-center gap-1 opacity-60 font-normal border-l border-white/20 pl-2">
        <Monitor className="h-3 w-3" /> / <Smartphone className="h-3 w-3" />
      </span>
    </button>
  );
}
