import { Text, Pressable } from "react-native";
import { Production } from "../lib/types";

type Props = {
  production: Production;
  onPress: () => void;
};

export default function ProductionRow({ production, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="py-2 pl-6 border-b border-divider-lighter">
      <Text className="text-sm">
        {production.venue ?? "Unknown venue"}
        {production.year ? `, ${production.year}` : ""}
      </Text>
      {production.director && (
        <Text className="text-xs text-subtle">dir. {production.director}</Text>
      )}
    </Pressable>
  );
}
