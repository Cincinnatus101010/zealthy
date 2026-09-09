import { describe, expect, it } from "vitest";
import { getMetricRegion } from "@/lib/wellness/body-regions";

describe("body-regions", () => {
  it("maps known metric labels to body regions", () => {
    expect(getMetricRegion("Sleep", "sleep")).toBe("head");
    expect(getMetricRegion("Water", "physical")).toBe("chest");
    expect(getMetricRegion("Steps", "physical")).toBe("legs");
  });

  it("falls back to section accent when label is unknown", () => {
    expect(getMetricRegion("Unknown", "mental")).toBe("chest");
    expect(getMetricRegion("Unknown", "physical")).toBe("legs");
  });
});
