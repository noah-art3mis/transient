import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const logEntriesApi = require("../../../lib/api/log-entries");

describe("getLogEntries", () => {
  it("returns user log entries ordered by date", async () => {
    const mockEntries = [{ id: "le1", date_seen: "2026-04-05", production: { venue: "Globe" } }];
    const builder = createMockQueryBuilder({ data: mockEntries, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await logEntriesApi.getLogEntries("user-1");

    expect(supabase.from).toHaveBeenCalledWith("log_entries");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.order).toHaveBeenCalledWith("date_seen", { ascending: false });
    expect(result).toEqual(mockEntries);
  });

  it("filters by year when provided", async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await logEntriesApi.getLogEntries("user-1", 2026);

    expect(builder.gte).toHaveBeenCalledWith("date_seen", "2026-01-01");
    expect(builder.lte).toHaveBeenCalledWith("date_seen", "2026-12-31");
  });
});

describe("createLogEntry", () => {
  it("inserts a new log entry and returns it", async () => {
    const newEntry = { id: "le2", production_id: "p1", user_id: "user-1" };
    const builder = createMockQueryBuilder({ data: newEntry, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await logEntriesApi.createLogEntry({
      production_id: "p1",
      user_id: "user-1",
    });

    expect(supabase.from).toHaveBeenCalledWith("log_entries");
    expect(builder.insert).toHaveBeenCalledWith({ production_id: "p1", user_id: "user-1" });
    expect(result).toEqual(newEntry);
  });
});

describe("updateLogEntry", () => {
  it("updates and returns the entry", async () => {
    const updated = { id: "le1", rating: 4.5 };
    const builder = createMockQueryBuilder({ data: updated, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await logEntriesApi.updateLogEntry("le1", { rating: 4.5 });

    expect(builder.update).toHaveBeenCalledWith({ rating: 4.5 });
    expect(builder.eq).toHaveBeenCalledWith("id", "le1");
    expect(result).toEqual(updated);
  });
});

describe("deleteLogEntry", () => {
  it("deletes a log entry by id", async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await logEntriesApi.deleteLogEntry("le1");

    expect(supabase.from).toHaveBeenCalledWith("log_entries");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "le1");
  });
});
