import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Language = "en" | "ne";

interface LanguageContextValue {
  language: Language;
  isNepali: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (text: string) => string;
}

const STORAGE_KEY = "nsvm-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const href = window.location.href;
    if (href.includes("lang=ne")) return "ne";
    if (href.includes("lang=en")) return "en";
    return localStorage.getItem(STORAGE_KEY) === "ne" ? "ne" : "en";
  });

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      isNepali: language === "ne",
      setLanguage,
      toggleLanguage: () => setLanguage(language === "ne" ? "en" : "ne"),
      t: (text: string) => text,
    }),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language === "ne" ? "ne" : "en";
    document.body.classList.toggle("nepali-mode", language === "ne");
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
