import { Languages } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageToggleProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageToggle({
  compact = false,
  className = "",
}: LanguageToggleProps) {
  const { isNepali, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      data-no-translate
      aria-label={isNepali ? "Switch to English" : "Switch to Nepali"}
      className={`language-toggle ${compact ? "language-toggle-compact" : ""} ${className}`}
    >
      <Languages className="h-4 w-4" />
      <span>{isNepali ? "English" : "नेपाली"}</span>
    </button>
  );
}
