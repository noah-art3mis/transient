import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../lib/auth-context";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: unknown) {
      Alert.alert(t("common.error"), e instanceof Error ? e.message : t("login.signInFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background justify-center px-6">
      <Text className="text-3xl font-bold mb-8 text-center">{t("login.title")}</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t("login.emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-input rounded-lg px-4 py-3 mb-3 text-base"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t("login.passwordPlaceholder")}
        secureTextEntry
        className="border border-input rounded-lg px-4 py-3 mb-6 text-base"
      />
      <Pressable
        onPress={handleSignIn}
        disabled={loading}
        className="bg-primary rounded-lg py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-primary-foreground font-semibold text-base">
            {t("login.signIn")}
          </Text>
        )}
      </Pressable>
      <Link href="/(auth)/signup" asChild>
        <Pressable className="py-2 items-center">
          <Text className="text-accent-foreground">
            {t("login.noAccount")}{" "}
            <Text className="text-foreground font-semibold">{t("login.signUp")}</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
