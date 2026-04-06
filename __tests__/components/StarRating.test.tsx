import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import StarRating from "../../components/StarRating";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("StarRating", () => {
  it("renders 5 star positions", () => {
    const { getAllByTestId } = render(
      <StarRating value={null} onChange={() => {}} />
    );
    expect(getAllByTestId(/^star-\d+-left$/)).toHaveLength(5);
    expect(getAllByTestId(/^star-\d+-right$/)).toHaveLength(5);
  });

  it("calls onChange with half-star value on left tap", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <StarRating value={null} onChange={onChange} />
    );
    fireEvent.press(getByTestId("star-3-left"));
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("calls onChange with full-star value on right tap", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <StarRating value={null} onChange={onChange} />
    );
    fireEvent.press(getByTestId("star-3-right"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clears rating when tapping the same value", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <StarRating value={3} onChange={onChange} />
    );
    fireEvent.press(getByTestId("star-3-right"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
