import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../lib/auth-context";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold mb-8 text-center">Transient</Text>
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
        onPress={handleSignIn}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign In</Text>
        )}
      </Pressable>
      <Link href="/(auth)/signup" asChild>
        <Pressable className="py-2 items-center">
          <Text className="text-gray-600">
            Don't have an account?{" "}
            <Text className="text-black font-semibold">Sign Up</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
