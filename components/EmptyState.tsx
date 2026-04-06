import { View, Text } from "react-native";

type Props = {
  message: string;
};

export default function EmptyState({ message }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-gray-400 text-center text-base">{message}</Text>
    </View>
  );
}
