import { supabase } from "../supabase";
import { MediaType, Stats } from "../types";

export async function getStats(userId: string): Promise<Stats> {
  const { data: entries, count, error } = await supabase
    .from("log_entries")
    .select(
      "date_seen, rating, production:productions(venue, work:works(media_type))",
      { count: "exact" }
    )
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const all = entries ?? [];
  const currentYear = new Date().getFullYear();

  const totalShows = count ?? all.length;
  const showsThisYear = all.filter(
    (e) => new Date(e.date_seen).getFullYear() === currentYear
  ).length;

  const venues = new Set(
    all.map((e: any) => e.production?.venue).filter(Boolean)
  );
  const venuesVisited = venues.size;

  const ratingMap = new Map<number, number>();
  for (const e of all) {
    if (e.rating != null) {
      ratingMap.set(e.rating, (ratingMap.get(e.rating) ?? 0) + 1);
    }
  }
  const ratingDistribution = Array.from(ratingMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  const typeMap = new Map<string, number>();
  for (const e of all) {
    const mt = (e as any).production?.work?.media_type ?? "other";
    typeMap.set(mt, (typeMap.get(mt) ?? 0) + 1);
  }
  const byMediaType = Array.from(typeMap.entries())
    .map(([media_type, count]) => ({ media_type: media_type as MediaType, count }))
    .sort((a, b) => b.count - a.count);

  const yearMap = new Map<number, number>();
  for (const e of all) {
    const y = new Date(e.date_seen).getFullYear();
    yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
  }
  const byYear = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);

  return { totalShows, showsThisYear, venuesVisited, ratingDistribution, byMediaType, byYear };
}
