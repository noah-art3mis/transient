import { Platform } from "react-native";
import { Stack } from "expo-router";

const webContentStyle =
  Platform.OS === "web"
    ? {
        maxWidth: 480,
        width: "100%" as const,
        marginLeft: "auto" as const,
        marginRight: "auto" as const,
      }
    : undefined;

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: webContentStyle }} />;
}
