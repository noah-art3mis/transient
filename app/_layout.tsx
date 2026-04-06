import "../global.css";
import "../lib/i18n";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth-context";
import colors from "../lib/theme/colors";

const webContentStyle =
  Platform.OS === "web"
    ? {
        maxWidth: 900,
        width: "100%" as const,
        marginLeft: "auto" as const,
        marginRight: "auto" as const,
        backgroundColor: colors.background,
      }
    : undefined;

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="log"
        options={{ presentation: "modal", contentStyle: webContentStyle }}
      />
      <Stack.Screen name="production" options={{ contentStyle: webContentStyle }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
