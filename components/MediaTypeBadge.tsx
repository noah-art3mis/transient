import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import { MediaType } from "../lib/types";

type Props = {
  type: MediaType;
};

export default function MediaTypeBadge({ type }: Props) {
  const { t } = useTranslation();

  return (
    <View className="bg-gray-100 rounded px-2 py-0.5 self-start">
      <Text className="text-xs text-gray-600">{t(`mediaType.${type}`)}</Text>
    </View>
  );
}
