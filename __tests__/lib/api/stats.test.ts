import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const statsApi = require("../../../lib/api/stats");

describe("getStats", () => {
  it("computes stats from log entries", async () => {
    const mockEntries = [
      {
        date_seen: "2026-03-15",
        rating: 4.0,
        production: { venue: "Globe", work: { media_type: "theatre" } },
      },
      {
        date_seen: "2026-01-10",
        rating: 3.5,
        production: { venue: "Almeida", work: { media_type: "theatre" } },
      },
      {
        date_seen: "2025-11-20",
        rating: 5.0,
        production: { venue: "Globe", work: { media_type: "musical" } },
      },
    ];
    const builder = createMockQueryBuilder({
      data: mockEntries,
      count: 3,
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await statsApi.getStats("user-1");

    expect(result.totalShows).toBe(3);
    expect(result.venuesVisited).toBe(2);
    expect(result.ratingDistribution).toEqual(
      expect.arrayContaining([
        { rating: 3.5, count: 1 },
        { rating: 4.0, count: 1 },
        { rating: 5.0, count: 1 },
      ])
    );
    expect(result.byMediaType).toEqual(
      expect.arrayContaining([
        { media_type: "theatre", count: 2 },
        { media_type: "musical", count: 1 },
      ])
    );
  });
});
