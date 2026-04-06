import { supabase } from "../supabase";
import { Production, ProductionInsert, Work } from "../types";

export async function getProductionsByWork(workId: string): Promise<Production[]> {
  const { data, error } = await supabase
    .from("productions")
    .select("*")
    .eq("work_id", workId)
    .order("year", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProduction(
  id: string
): Promise<(Production & { work: Work | null }) | null> {
  const { data, error } = await supabase
    .from("productions")
    .select("*, work:works(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduction(production: ProductionInsert): Promise<Production> {
  const { data, error } = await supabase
    .from("productions")
    .insert(production)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
