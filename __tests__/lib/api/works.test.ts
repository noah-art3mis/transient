import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const worksApi = require("../../../lib/api/works");

describe("searchWorks", () => {
  it("searches works by query and returns results", async () => {
    const mockWorks = [{ id: "1", title: "Hamlet", productions: [{ count: 3 }] }];
    const builder = createMockQueryBuilder({ data: mockWorks, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await worksApi.searchWorks("hamlet");

    expect(supabase.from).toHaveBeenCalledWith("works");
    expect(builder.select).toHaveBeenCalledWith("*, productions(count)");
    expect(builder.textSearch).toHaveBeenCalledWith("search_vector", "hamlet", { type: "plain" });
    expect(builder.limit).toHaveBeenCalledWith(20);
    expect(result).toEqual(mockWorks);
  });

  it("throws on supabase error", async () => {
    const builder = createMockQueryBuilder({ data: null, error: { message: "search failed" } });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await expect(worksApi.searchWorks("test")).rejects.toThrow("search failed");
  });
});

describe("getWork", () => {
  it("returns a single work by id", async () => {
    const mockWork = { id: "1", title: "Hamlet" };
    const builder = createMockQueryBuilder({ data: mockWork, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await worksApi.getWork("1");

    expect(supabase.from).toHaveBeenCalledWith("works");
    expect(builder.eq).toHaveBeenCalledWith("id", "1");
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(mockWork);
  });
});

describe("createWork", () => {
  it("inserts a new work and returns it", async () => {
    const newWork = { id: "2", title: "Macbeth" };
    const builder = createMockQueryBuilder({ data: newWork, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await worksApi.createWork({ title: "Macbeth" });

    expect(supabase.from).toHaveBeenCalledWith("works");
    expect(builder.insert).toHaveBeenCalledWith({ title: "Macbeth" });
    expect(builder.select).toHaveBeenCalled();
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(newWork);
  });
});
