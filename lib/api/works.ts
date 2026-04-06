import { supabase } from "../supabase";
import { Work, WorkInsert, WorkWithProductionCount } from "../types";

export async function searchWorks(query: string): Promise<WorkWithProductionCount[]> {
  const { data, error } = await supabase
    .from("works")
    .select("*, productions(count)")
    .textSearch("search_vector", query, { type: "plain" })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWork(id: string): Promise<Work | null> {
  const { data, error } = await supabase.from("works").select("*").eq("id", id).single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createWork(work: WorkInsert): Promise<Work> {
  const { data, error } = await supabase.from("works").insert(work).select().single();

  if (error) throw new Error(error.message);
  return data;
}
