
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Button from "../components/ui/Button";

afterEach(cleanup);

describe("Button component", () => {
  it("renders the correct button label", () => {
    render(<Button>Continue</Button>);

    expect(
      screen.getByRole("button", { name: "Continue" })
    ).toBeInTheDocument();
  });

  it("supports the submit type and disabled state", () => {
    render(
      <Button type="submit" disabled>
        Sign in
      </Button>
    );

    const button = screen.getByRole("button", {
      name: "Sign in",
    });

    expect(button).toHaveAttribute("type", "submit");
    expect(button).toBeDisabled();
  });
});
