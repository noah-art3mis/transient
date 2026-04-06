import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogEntryWithProduction } from "../lib/types";
import StarRatingDisplay from "./StarRatingDisplay";

type Props = {
  entry: LogEntryWithProduction;
  onPress: () => void;
};

export default function DiaryEntryRow({ entry, onPress }: Props) {
  const title = entry.production.title_override ?? entry.production.work?.title ?? "Unknown";
  const venue = entry.production.venue;

  const date = new Date(entry.date_seen + "T00:00:00");
  const formatted = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      <Text className="w-16 text-sm text-gray-500">{formatted}</Text>
      <View className="flex-1 mx-2">
        <Text className="font-semibold" numberOfLines={1}>
          {title}
        </Text>
        {venue && (
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {venue}
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-1">
        {entry.rating !== null && <StarRatingDisplay value={entry.rating} size={12} />}
        {entry.liked && <Ionicons name="heart" size={14} color="#ef4444" />}
        {entry.review && <Ionicons name="document-text-outline" size={14} color="#9ca3af" />}
      </View>
    </Pressable>
  );
}
