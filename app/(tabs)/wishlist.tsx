import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth-context";
import { getWishlist, removeFromWishlist } from "../../lib/api/wishlist";
import { WishlistItemWithDetails } from "../../lib/types";
import EmptyState from "../../components/EmptyState";

export default function WishlistScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadWishlist(); }, [session]));

  async function loadWishlist() {
    if (!session) return;
    setLoading(true);
    try { const data = await getWishlist(session.user.id); setItems(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleRemove(id: string) {
    Alert.alert("Remove", "Remove from wishlist?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try { await removeFromWishlist(id); setItems((prev) => prev.filter((i) => i.id !== id)); }
        catch (e) { console.error(e); }
      }},
    ]);
  }

  function handlePress(item: WishlistItemWithDetails) {
    if (item.production_id) router.push(`/production/${item.production_id}`);
  }

  if (items.length === 0 && !loading) {
    return <EmptyState message="Nothing on your list yet. Browse shows and tap the bookmark icon to add." />;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      className="flex-1 bg-white"
      renderItem={({ item }) => {
        const title = item.production
          ? item.production.title_override ?? item.production.work?.title ?? "Unknown"
          : item.work?.title ?? "Unknown";
        const subtitle = item.production?.venue
          ? `${item.production.venue}${item.production.year ? `, ${item.production.year}` : ""}`
          : null;
        const dateAdded = new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

        return (
          <Pressable onPress={() => handlePress(item)} className="px-4 py-3 border-b border-gray-100 flex-row items-center">
            <View className="flex-1">
              <Text className="font-semibold">{title}</Text>
              {subtitle && <Text className="text-sm text-gray-500">{subtitle}</Text>}
              {item.notes && <Text className="text-sm text-gray-400 mt-1" numberOfLines={1}>{item.notes}</Text>}
              <Text className="text-xs text-gray-300 mt-1">Added {dateAdded}</Text>
            </View>
            <Pressable onPress={() => handleRemove(item.id)} className="p-2">
              <Text className="text-red-400 text-sm">Remove</Text>
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}
