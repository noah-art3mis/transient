import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth-context";
import { getProduction } from "../../lib/api/productions";
import { getLogEntriesForProduction } from "../../lib/api/log-entries";
import { addToWishlist } from "../../lib/api/wishlist";
import { Production, Work, LogEntry } from "../../lib/types";
import StarRatingDisplay from "../../components/StarRatingDisplay";
import MediaTypeBadge from "../../components/MediaTypeBadge";
import colors from "../../lib/theme/colors";

export default function ProductionDetailScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const router = useRouter();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [production, setProduction] = useState<(Production & { work: Work | null }) | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id || !userId) return;
    try {
      const [prod, entries] = await Promise.all([
        getProduction(id),
        getLogEntriesForProduction(id, userId),
      ]);
      setProduction(prod);
      setLogEntries(entries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddToWishlist() {
    if (!session || !id) return;
    try {
      await addToWishlist({ user_id: session.user.id, production_id: id });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading || !production) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const title = production.title_override ?? production.work?.title ?? t("common.unknown");
  const work = production.work;

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-4 border-b border-divider">
        {production.poster_url && (
          <Image
            source={{ uri: production.poster_url }}
            className="w-full h-48 rounded-lg mb-3"
            resizeMode="cover"
          />
        )}
        <Text className="text-2xl font-bold">{title}</Text>
        <Text className="text-muted-foreground mt-1">
          {production.venue ?? t("common.unknownVenue")}
          {production.year ? `, ${production.year}` : ""}
        </Text>
        {production.director && (
          <Text className="text-muted-foreground">
            {t("common.dir")} {production.director}
          </Text>
        )}
        {production.start_date && production.end_date && (
          <Text className="text-sm text-subtle mt-1">
            {production.start_date} — {production.end_date}
          </Text>
        )}
        {work && <MediaTypeBadge type={work.media_type} />}
      </View>

      {work && work.creators.length > 0 && (
        <View className="px-4 py-3 border-b border-divider-light">
          <Text className="font-semibold mb-2">{t("production.creators")}</Text>
          {work.creators.map((c, i) => (
            <Text key={i} className="text-sm text-accent-foreground">
              {c.name} ({c.role})
            </Text>
          ))}
        </View>
      )}

      {production.cast_members.length > 0 && (
        <View className="px-4 py-3 border-b border-divider-light">
          <Text className="font-semibold mb-2">{t("production.cast")}</Text>
          {production.cast_members.map((c, i) => (
            <Text key={i} className="text-sm text-accent-foreground">
              {c.name}
              {c.role ? ` ${t("production.castAs")} ${c.role}` : ""}
            </Text>
          ))}
        </View>
      )}

      <View className="px-4 py-3 border-b border-divider-light">
        <Text className="font-semibold mb-2">{t("production.yourLogEntries")}</Text>
        {logEntries.length === 0 ? (
          <Text className="text-subtle text-sm">{t("production.notLoggedYet")}</Text>
        ) : (
          logEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push(`/log/${entry.id}`)}
              className="py-2 border-b border-divider-lighter"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground">
                  {new Date(entry.date_seen + "T00:00:00").toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
                {entry.rating !== null && <StarRatingDisplay value={entry.rating} size={12} />}
                {entry.liked && <Ionicons name="heart" size={12} color={colors.heart} />}
              </View>
              {entry.review && (
                <Text className="text-sm text-accent-foreground mt-1" numberOfLines={2}>
                  {entry.review}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>

      <View className="px-4 py-4 gap-3">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/log/new",
              params: {
                productionId: production.id,
                productionTitle: title,
                productionVenue: production.venue ?? "",
              },
            })
          }
          className="py-3 rounded-lg bg-primary items-center"
        >
          <Text className="text-primary-foreground font-medium">{t("production.logThis")}</Text>
        </Pressable>
        <Pressable
          onPress={handleAddToWishlist}
          className="py-3 rounded-lg bg-secondary items-center"
        >
          <Text className="font-medium">{t("production.addToWishlist")}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
