import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../lib/theme/colors";

type Props = {
  value: number;
  size?: number;
};

export default function StarRatingDisplay({ value, size = 14 }: Props) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => {
        let icon: "star" | "star-half" | "star-outline" = "star-outline";
        if (value >= star) icon = "star";
        else if (value >= star - 0.5) icon = "star-half";

        return (
          <Ionicons
            key={star}
            name={icon}
            size={size}
            color={icon === "star-outline" ? colors.rating.empty : colors.rating.DEFAULT}
          />
        );
      })}
    </View>
  );
}
