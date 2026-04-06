import { supabase } from "../supabase";
import { WishlistItem, WishlistItemInsert, WishlistItemWithDetails } from "../types";

export async function getWishlist(userId: string): Promise<WishlistItemWithDetails[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*, work:works(*), production:productions(*, work:works(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addToWishlist(item: WishlistItemInsert): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert(item)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function removeFromWishlist(id: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
