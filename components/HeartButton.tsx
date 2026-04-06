import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
        color={value ? "#ef4444" : "#9ca3af"}
      />
    </Pressable>
  );
}
