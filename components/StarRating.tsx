import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../lib/theme/colors";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
};

export default function StarRating({ value, onChange, size = 32 }: Props) {
  function handlePress(starValue: number) {
    onChange(value === starValue ? null : starValue);
  }

  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => {
        const halfValue = star - 0.5;
        const fullValue = star;

        let icon: "star" | "star-half" | "star-outline" = "star-outline";
        if (value !== null) {
          if (value >= fullValue) icon = "star";
          else if (value >= halfValue) icon = "star-half";
        }

        const color = icon === "star-outline" ? colors.rating.empty : colors.rating.DEFAULT;

        return (
          <View key={star} style={{ width: size, height: size, position: "relative" }}>
            <Ionicons name={icon} size={size} color={color} style={{ position: "absolute" }} />
            <Pressable
              testID={`star-${star}-left`}
              onPress={() => handlePress(halfValue)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: size / 2,
                height: size,
              }}
            />
            <Pressable
              testID={`star-${star}-right`}
              onPress={() => handlePress(fullValue)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: size / 2,
                height: size,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
