import { View, Text, Pressable, Alert, Share } from "react-native";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  async function handleExportData() {
    if (!session) return;
    try {
      const { data: entries, error } = await supabase
        .from("log_entries")
        .select("date_seen, rating, review, liked, tags, is_rewatch, production:productions(venue, year, title_override, work:works(title, media_type))")
        .eq("user_id", session.user.id)
        .order("date_seen", { ascending: false });

      if (error) throw error;

      const csv = [
        "date_seen,title,venue,year,rating,liked,rewatch,tags,review",
        ...(entries ?? []).map((e: any) => {
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
      Alert.alert("Error", "Failed to export data.");
    }
  }

  async function handleSignOut() {
    try { await signOut(); }
    catch (e: any) { Alert.alert("Error", e.message); }
  }

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      <View className="mb-6 pb-4 border-b border-gray-200">
        <Text className="text-sm text-gray-500">Signed in as</Text>
        <Text className="text-base font-medium">{session?.user.email ?? "Unknown"}</Text>
      </View>
      <Pressable onPress={handleExportData} className="py-3 border-b border-gray-100">
        <Text className="text-base">Export my data (CSV)</Text>
        <Text className="text-sm text-gray-400">Download all your log entries</Text>
      </Pressable>
      <View className="py-3 border-b border-gray-100">
        <Text className="text-base">About</Text>
        <Text className="text-sm text-gray-400">Transient v1.0.0</Text>
      </View>
      <Pressable onPress={handleSignOut} className="py-4 mt-6 items-center">
        <Text className="text-red-500 font-medium text-base">Sign Out</Text>
      </Pressable>
    </View>
  );
}
