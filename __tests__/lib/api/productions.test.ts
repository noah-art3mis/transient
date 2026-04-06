import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const productionsApi = require("../../../lib/api/productions");

describe("getProductionsByWork", () => {
  it("returns productions for a given work", async () => {
    const mockProds = [
      { id: "p1", work_id: "w1", venue: "Almeida Theatre", year: 2025 },
    ];
    const builder = createMockQueryBuilder({ data: mockProds, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await productionsApi.getProductionsByWork("w1");

    expect(supabase.from).toHaveBeenCalledWith("productions");
    expect(builder.eq).toHaveBeenCalledWith("work_id", "w1");
    expect(result).toEqual(mockProds);
  });
});

describe("getProduction", () => {
  it("returns a single production with work data", async () => {
    const mockProd = {
      id: "p1",
      venue: "Almeida Theatre",
      work: { id: "w1", title: "Hamlet" },
    };
    const builder = createMockQueryBuilder({ data: mockProd, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await productionsApi.getProduction("p1");

    expect(supabase.from).toHaveBeenCalledWith("productions");
    expect(builder.select).toHaveBeenCalledWith("*, work:works(*)");
    expect(builder.eq).toHaveBeenCalledWith("id", "p1");
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(mockProd);
  });
});

describe("createProduction", () => {
  it("inserts a new production and returns it", async () => {
    const newProd = { id: "p2", work_id: "w1", venue: "Globe", year: 2026 };
    const builder = createMockQueryBuilder({ data: newProd, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await productionsApi.createProduction({
      work_id: "w1",
      venue: "Globe",
      year: 2026,
    });

    expect(supabase.from).toHaveBeenCalledWith("productions");
    expect(builder.insert).toHaveBeenCalledWith({ work_id: "w1", venue: "Globe", year: 2026 });
    expect(result).toEqual(newProd);
  });
});
