import { useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth-context";
import { getStats } from "../../lib/api/stats";
import { Stats } from "../../lib/types";

export default function StatsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getStats(userId);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  if (loading || !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const maxRatingCount = Math.max(...stats.ratingDistribution.map((r) => r.count), 1);

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-4">
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-muted rounded-lg p-4 items-center">
          <Text className="text-2xl font-bold">{stats.totalShows}</Text>
          <Text className="text-xs text-muted-foreground mt-1">{t("stats.totalShows")}</Text>
        </View>
        <View className="flex-1 bg-muted rounded-lg p-4 items-center">
          <Text className="text-2xl font-bold">{stats.showsThisYear}</Text>
          <Text className="text-xs text-muted-foreground mt-1">{t("stats.thisYear")}</Text>
        </View>
        <View className="flex-1 bg-muted rounded-lg p-4 items-center">
          <Text className="text-2xl font-bold">{stats.venuesVisited}</Text>
          <Text className="text-xs text-muted-foreground mt-1">{t("stats.venues")}</Text>
        </View>
      </View>

      {stats.ratingDistribution.length > 0 && (
        <View className="mb-6">
          <Text className="font-semibold mb-3">{t("stats.ratingDistribution")}</Text>
          {stats.ratingDistribution.map(({ rating, count }) => (
            <View key={rating} className="flex-row items-center mb-1">
              <Text className="w-10 text-xs text-muted-foreground text-right mr-2">{rating}</Text>
              <View className="flex-1 h-5 bg-accent rounded overflow-hidden">
                <View
                  className="h-full bg-rating rounded"
                  style={{ width: `${(count / maxRatingCount) * 100}%` }}
                />
              </View>
              <Text className="w-8 text-xs text-muted-foreground text-right ml-2">{count}</Text>
            </View>
          ))}
        </View>
      )}

      {stats.byMediaType.length > 0 && (
        <View className="mb-6">
          <Text className="font-semibold mb-3">{t("stats.byMediaType")}</Text>
          {stats.byMediaType.map(({ media_type, count }) => (
            <View
              key={media_type}
              className="flex-row justify-between py-2 border-b border-divider-lighter"
            >
              <Text className="text-secondary-foreground capitalize">{media_type}</Text>
              <Text className="text-muted-foreground">{count}</Text>
            </View>
          ))}
        </View>
      )}

      {stats.byYear.length > 0 && (
        <View className="mb-8">
          <Text className="font-semibold mb-3">{t("stats.byYear")}</Text>
          {stats.byYear.map(({ year, count }) => (
            <View
              key={year}
              className="flex-row justify-between py-2 border-b border-divider-lighter"
            >
              <Text className="text-secondary-foreground">{year}</Text>
              <Text className="text-muted-foreground">{count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
