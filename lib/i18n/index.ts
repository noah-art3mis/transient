import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./locales/en.json";
import ptBR from "./locales/pt-BR.json";

const LANGUAGE_STORAGE_KEY = "@transient/language";

function getDeviceLanguage(): string {
  const locale = getLocales()[0]?.languageCode ?? "en";
  return locale.startsWith("pt") ? "pt-BR" : "en";
}

async function getStoredLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setLanguage(lng: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  await i18n.changeLanguage(lng);
}

async function initI18n() {
  const stored = await getStoredLanguage();
  const lng = stored ?? getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      "pt-BR": { translation: ptBR },
    },
    lng,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });
}

initI18n();

export default i18n;
