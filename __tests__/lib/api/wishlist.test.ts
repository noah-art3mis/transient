import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const wishlistApi = require("../../../lib/api/wishlist");

describe("getWishlist", () => {
  it("returns user wishlist items", async () => {
    const mockItems = [{ id: "wi1", work_id: "w1", notes: "Want to see" }];
    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await wishlistApi.getWishlist("user-1");

    expect(supabase.from).toHaveBeenCalledWith("wishlist_items");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual(mockItems);
  });
});

describe("addToWishlist", () => {
  it("inserts a wishlist item", async () => {
    const newItem = { id: "wi2", user_id: "user-1", work_id: "w1" };
    const builder = createMockQueryBuilder({ data: newItem, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await wishlistApi.addToWishlist({ user_id: "user-1", work_id: "w1" });

    expect(builder.insert).toHaveBeenCalledWith({ user_id: "user-1", work_id: "w1" });
    expect(result).toEqual(newItem);
  });
});

describe("removeFromWishlist", () => {
  it("deletes a wishlist item", async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await wishlistApi.removeFromWishlist("wi1");

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "wi1");
  });
});
