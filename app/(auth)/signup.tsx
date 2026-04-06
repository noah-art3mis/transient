import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../lib/auth-context";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert("Success", "Check your email to confirm your account.");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold mb-8 text-center">Create Account</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3 text-base"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />
      <Pressable
        onPress={handleSignUp}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign Up</Text>
        )}
      </Pressable>
      <Link href="/(auth)/login" asChild>
        <Pressable className="py-2 items-center">
          <Text className="text-gray-600">
            Already have an account? <Text className="text-black font-semibold">Sign In</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
