import { View, Text, Pressable } from "react-native";
import { WorkWithProductionCount } from "../lib/types";
import MediaTypeBadge from "./MediaTypeBadge";

type Props = {
  work: WorkWithProductionCount;
  onPress: () => void;
  expanded: boolean;
};

export default function WorkSearchResult({ work, onPress, expanded }: Props) {
  const firstCreator = work.creators?.[0];
  const prodCount = work.productions?.[0]?.count ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className={`py-3 border-b border-gray-100 ${expanded ? "bg-gray-50" : ""}`}
    >
      <Text className="font-semibold">{work.title}</Text>
      {firstCreator && (
        <Text className="text-sm text-gray-500">
          {firstCreator.role}: {firstCreator.name}
        </Text>
      )}
      <View className="flex-row items-center gap-2 mt-1">
        <MediaTypeBadge type={work.media_type} />
        <Text className="text-xs text-gray-400">
          {prodCount} production{prodCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </Pressable>
  );
}
