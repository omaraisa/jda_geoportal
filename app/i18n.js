import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import useStateStore from "@/stateManager";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

i18n.use(initReactI18next).init({
  
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: "en", // Default language
  fallbackLng: "en",
  interpolation: { escapeValue: false }, // React already escapes by default
})

export default i18n;
