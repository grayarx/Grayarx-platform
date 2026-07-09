import { useState, useEffect, useCallback, ReactNode } from "react";
import { I18nContext, LanguageCode, translate } from "@/lib/i18n";

const STORAGE_KEY = "grayarx.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    return saved ?? "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, language);
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((l: LanguageCode) => setLanguageState(l), []);
  const t = useCallback((key: string) => translate(language, key), [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}
