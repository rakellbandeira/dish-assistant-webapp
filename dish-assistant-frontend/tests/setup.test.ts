import { describe, expect, it } from "vitest";

describe("testing environment", () => {
  it("uses jsdom correctly", () => {
    const element = document.createElement("div");
    element.textContent = "Dish Assistant";

    expect(element).toHaveTextContent("Dish Assistant");
  });
});