import { View, Text } from "react-native";
import { MediaType } from "../lib/types";

const LABELS: Record<MediaType, string> = {
  theatre: "Play",
  musical: "Musical",
  opera: "Opera",
  dance: "Dance",
  circus: "Circus",
  concert: "Concert",
  other: "Other",
};

type Props = {
  type: MediaType;
};

export default function MediaTypeBadge({ type }: Props) {
  return (
    <View className="bg-gray-100 rounded px-2 py-0.5 self-start">
      <Text className="text-xs text-gray-600">{LABELS[type] ?? type}</Text>
    </View>
  );
}
