import { describe, expect, it } from "vitest";
import { WellnessType } from "@prisma/client";
import { validateWellnessEntryInput } from "@/lib/wellness/entries";

describe("validateWellnessEntryInput", () => {
  it("accepts a valid entry payload", () => {
    expect(() =>
      validateWellnessEntryInput({
        type: WellnessType.water,
        label: "Water",
        value: 8,
        unit: "glasses",
        date: "2026-09-09",
      }),
    ).not.toThrow();
  });

  it("rejects missing labels", () => {
    expect(() =>
      validateWellnessEntryInput({
        type: WellnessType.custom,
        label: "   ",
        value: 5,
        date: "2026-09-09",
      }),
    ).toThrow("Activity label is required.");
  });
});
