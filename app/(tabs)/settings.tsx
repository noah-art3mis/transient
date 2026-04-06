import { useState } from "react";
import { View, Text, Pressable, Alert, Share } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { setLanguage } from "../../lib/i18n";

type ExportQueryRow = {
  date_seen: string;
  rating: number | null;
  review: string | null;
  liked: boolean;
  tags: string[];
  is_rewatch: boolean;
  production: {
    title_override: string | null;
    venue: string | null;
    year: number | null;
    work: { title: string; media_type: string } | null;
  } | null;
};

const LANGUAGES = [
  { code: "en", label: "settings.languageEn" },
  { code: "pt-BR", label: "settings.languagePtBR" },
] as const;

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  async function handleLanguageChange(lng: string) {
    setCurrentLang(lng);
    await setLanguage(lng);
  }

  async function handleExportData() {
    if (!session) return;
    try {
      const { data: entries, error } = await supabase
        .from("log_entries")
        .select(
          "date_seen, rating, review, liked, tags, is_rewatch, production:productions(venue, year, title_override, work:works(title, media_type))",
        )
        .eq("user_id", session.user.id)
        .order("date_seen", { ascending: false });

      if (error) throw error;

      const rows = (entries ?? []) as unknown as ExportQueryRow[];
      const csv = [
        "date_seen,title,venue,year,rating,liked,rewatch,tags,review",
        ...rows.map((e) => {
          const title = e.production?.title_override ?? e.production?.work?.title ?? "";
          const venue = e.production?.venue ?? "";
          const year = e.production?.year ?? "";
          const review = (e.review ?? "").replace(/"/g, '""');
          const tags = (e.tags ?? []).join("; ");
          return `${e.date_seen},"${title}","${venue}",${year},${e.rating ?? ""},${e.liked},${e.is_rewatch},"${tags}","${review}"`;
        }),
      ].join("\n");

      await Share.share({ message: csv, title: "Transient Export" });
    } catch (e) {
      console.error(e);
      Alert.alert(t("common.error"), t("settings.exportFailed"));
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (e: unknown) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("settings.signOutFailed"));
    }
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <View className="mb-6 pb-4 border-b border-divider">
        <Text className="text-sm text-muted-foreground">{t("settings.signedInAs")}</Text>
        <Text className="text-base font-medium">{session?.user.email ?? t("common.unknown")}</Text>
      </View>

      <View className="py-3 border-b border-divider-light">
        <Text className="text-base mb-2">{t("settings.language")}</Text>
        <View className="flex-row gap-2">
          {LANGUAGES.map(({ code, label }) => (
            <Pressable
              key={code}
              onPress={() => handleLanguageChange(code)}
              className={`px-3 py-1 rounded-full ${currentLang === code ? "bg-primary" : "bg-secondary"}`}
            >
              <Text
                className={
                  currentLang === code ? "text-primary-foreground" : "text-secondary-foreground"
                }
              >
                {t(label)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={handleExportData} className="py-3 border-b border-divider-light">
        <Text className="text-base">{t("settings.exportCsv")}</Text>
        <Text className="text-sm text-subtle">{t("settings.exportDescription")}</Text>
      </Pressable>
      <View className="py-3 border-b border-divider-light">
        <Text className="text-base">{t("settings.about")}</Text>
        <Text className="text-sm text-subtle">{t("settings.version")}</Text>
      </View>
      <Pressable onPress={handleSignOut} className="py-4 mt-6 items-center">
        <Text className="text-destructive font-medium text-base">{t("settings.signOut")}</Text>
      </Pressable>
    </View>
  );
}
