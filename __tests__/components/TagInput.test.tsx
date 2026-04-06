import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TagInput from "../../components/TagInput";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: jest.fn() },
  }),
}));

describe("TagInput", () => {
  it("displays existing tags as pills", () => {
    const { getByText } = render(
      <TagInput value={["world premiere", "with Mum"]} onChange={() => {}} />,
    );
    expect(getByText("world premiere")).toBeTruthy();
    expect(getByText("with Mum")).toBeTruthy();
  });

  it("adds a tag when comma is typed", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(<TagInput value={[]} onChange={onChange} />);
    const input = getByPlaceholderText("logForm.tagsPlaceholder");
    fireEvent.changeText(input, "new tag,");
    expect(onChange).toHaveBeenCalledWith(["new tag"]);
  });

  it("removes a tag when X is pressed", () => {
    const onChange = jest.fn();
    const { getAllByTestId } = render(<TagInput value={["tag1", "tag2"]} onChange={onChange} />);
    fireEvent.press(getAllByTestId("remove-tag")[0]);
    expect(onChange).toHaveBeenCalledWith(["tag2"]);
  });
});
