import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("renders the shot-chart identity and selected player", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "NBA SHOT CHART" })).toBeVisible();
    expect(screen.getByText("Ja Morant")).toBeVisible();
    expect(screen.getByText("2019-20")).toBeVisible();
    expect(screen.getByText(/937 attempts, 447 makes, and 293/)).toBeVisible();
    const chart = screen.getByRole("graphics-document", {
      name: "Ja Morant 2019-20 Regular Season shot chart",
    });
    expect(chart).toBeVisible();
    expect(chart).toHaveAttribute("viewBox", expect.stringMatching(/^0 0 954 /));
    expect(screen.getAllByRole("graphics-symbol")).toHaveLength(284);
    const coverage = screen.getByText((_content, element) => element?.id === "chart-coverage");
    expect(coverage).toHaveTextContent("9 long-range attempts across 9 bins sit outside it");
  });

  it("exposes the same shot summary to pointer and keyboard users", async () => {
    const user = userEvent.setup();
    render(<App />);

    const sourceLink = screen.getByRole("link", { name: "NBA Stats" });
    const firstHex = screen.getAllByRole("graphics-symbol")[0];
    const status = screen.getByRole("status");

    expect(status).toHaveTextContent("Focus or point at a shot hex");

    await user.hover(firstHex);
    expect(status).toHaveTextContent("0 makes on 1 attempt (0%) from 3-point range");
    expect(firstHex).toBeEmptyDOMElement();
    expect(firstHex).not.toHaveStyle({ pointerEvents: "none" });

    await user.tab();
    expect(sourceLink).toHaveFocus();
    await user.tab();
    expect(firstHex).toHaveFocus();
    expect(status).toHaveTextContent("0 makes on 1 attempt (0%) from 3-point range");
  });
});
