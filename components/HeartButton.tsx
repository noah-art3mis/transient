import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../lib/theme/colors";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  size?: number;
};

export default function HeartButton({ value, onChange, size = 28 }: Props) {
  return (
    <Pressable onPress={() => onChange(!value)} testID="heart-button">
      <Ionicons
        name={value ? "heart" : "heart-outline"}
        size={size}
        color={value ? colors.heart : colors["icon-muted"]}
      />
    </Pressable>
  );
}
