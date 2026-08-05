import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the shot-chart identity and selected player", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "NBA SHOT CHART" })).toBeVisible();
    expect(screen.getByText("Morant")).toBeVisible();
  });
});
