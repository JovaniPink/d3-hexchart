import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the shot-chart identity and selected player", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "NBA SHOT CHART" })).toBeVisible();
    expect(screen.getByText("Ja Morant")).toBeVisible();
    expect(screen.getByText("2019-20")).toBeVisible();
    expect(screen.getByText(/937 attempts, 447 makes, and 293/)).toBeVisible();
    expect(
      screen.getByRole("graphics-document", {
        name: "Ja Morant 2019-20 Regular Season shot chart",
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("graphics-symbol")).toHaveLength(293);
  });
});
