import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { updateLogEntry, deleteLogEntry } from "../../lib/api/log-entries";
import { supabase } from "../../lib/supabase";
import { LogEntryWithProduction } from "../../lib/types";
import StarRating from "../../components/StarRating";
import HeartButton from "../../components/HeartButton";
import TagInput from "../../components/TagInput";

export default function EditLogEntryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entry, setEntry] = useState<LogEntryWithProduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateSeen, setDateSeen] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const loadEntry = useCallback(async () => {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*, production:productions(*, work:works(*))")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error(error);
      router.back();
      return;
    }

    setEntry(data as LogEntryWithProduction);
    setDateSeen(data.date_seen);
    setRating(data.rating);
    setLiked(data.liked);
    setIsRewatch(data.is_rewatch);
    setReview(data.review ?? "");
    setTags(data.tags ?? []);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadEntry();
  }, [loadEntry]);

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateLogEntry(id, {
        date_seen: dateSeen,
        rating,
        review: review || null,
        liked,
        tags,
        is_rewatch: isRewatch,
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert(t("logEdit.deleteTitle"), t("logEdit.deleteMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (!id) return;
            await deleteLogEntry(id);
            router.back();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  }

  if (loading || !entry) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const title =
    entry.production.title_override ?? entry.production.work?.title ?? t("common.unknown");

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      <View className="mb-4 pb-4 border-b border-gray-200">
        <Text className="text-lg font-bold">{title}</Text>
        {entry.production.venue && <Text className="text-gray-500">{entry.production.venue}</Text>}
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">{t("logForm.dateSeen")}</Text>
        <TextInput
          value={dateSeen}
          onChangeText={setDateSeen}
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">{t("logForm.rating")}</Text>
        <StarRating value={rating} onChange={setRating} />
      </View>
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">{t("logForm.liked")}</Text>
        <HeartButton value={liked} onChange={setLiked} />
      </View>
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">{t("logForm.rewatch")}</Text>
        <Pressable
          onPress={() => setIsRewatch(!isRewatch)}
          className={`px-3 py-1 rounded-full ${isRewatch ? "bg-black" : "bg-gray-200"}`}
        >
          <Text className={isRewatch ? "text-white" : "text-gray-700"}>
            {isRewatch ? t("common.yes") : t("common.no")}
          </Text>
        </Pressable>
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">{t("logForm.review")}</Text>
        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder={t("logForm.reviewPlaceholder")}
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg px-4 py-2 min-h-[100px] text-base"
          textAlignVertical="top"
        />
      </View>
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">{t("logForm.tags")}</Text>
        <TagInput value={tags} onChange={setTags} />
      </View>
      <View className="flex-row gap-3 mb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
        >
          <Text className="font-medium">{t("common.cancel")}</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-lg bg-black items-center"
        >
          <Text className="text-white font-medium">
            {saving ? t("common.saving") : t("common.save")}
          </Text>
        </Pressable>
      </View>
      <Pressable onPress={handleDelete} className="py-3 items-center mb-8">
        <Text className="text-red-500 font-medium">{t("logEdit.deleteButton")}</Text>
      </Pressable>
    </ScrollView>
  );
}
