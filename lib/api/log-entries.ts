import { supabase } from "../supabase";
import { LogEntry, LogEntryInsert, LogEntryWithProduction } from "../types";

export async function getLogEntries(
  userId: string,
  year?: number
): Promise<LogEntryWithProduction[]> {
  let query = supabase
    .from("log_entries")
    .select("*, production:productions(*, work:works(*))")
    .eq("user_id", userId)
    .order("date_seen", { ascending: false });

  if (year) {
    query = query
      .gte("date_seen", `${year}-01-01`)
      .lte("date_seen", `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLogEntriesForProduction(
  productionId: string,
  userId: string
): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from("log_entries")
    .select("*")
    .eq("production_id", productionId)
    .eq("user_id", userId)
    .order("date_seen", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLogEntry(entry: LogEntryInsert): Promise<LogEntry> {
  const { data, error } = await supabase
    .from("log_entries")
    .insert(entry)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLogEntry(
  id: string,
  updates: Partial<LogEntryInsert>
): Promise<LogEntry> {
  const { data, error } = await supabase
    .from("log_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLogEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("log_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
