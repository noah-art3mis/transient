import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth-context";
import { getLogEntries } from "../../lib/api/log-entries";
import { LogEntryWithProduction } from "../../lib/types";
import DiaryEntryRow from "../../components/DiaryEntryRow";
import EmptyState from "../../components/EmptyState";

export default function DiaryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntryWithProduction[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years: (number | null)[] = [null, currentYear, currentYear - 1];

  const loadEntries = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await getLogEntries(
        session.user.id,
        selectedYear ?? undefined
      );
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session, selectedYear]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  return (
    <View className="flex-1 bg-white">
      {/* Year filter pills */}
      <View className="px-4 pt-2 pb-2">
        <View className="flex-row gap-2">
          {years.map((year) => (
            <Pressable
              key={year ?? "all"}
              onPress={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-full ${
                selectedYear === year ? "bg-black" : "bg-gray-200"
              }`}
            >
              <Text
                className={
                  selectedYear === year ? "text-white" : "text-gray-700"
                }
              >
                {year ?? "All"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {entries.length === 0 && !loading ? (
        <EmptyState message="No shows logged yet. Tap + to log your first show." />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiaryEntryRow
              entry={item}
              onPress={() => router.push(`/log/${item.id}`)}
            />
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/log/new")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-black rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </Pressable>
    </View>
  );
}
