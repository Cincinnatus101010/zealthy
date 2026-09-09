import { describe, expect, it } from "vitest";
import { LOG_ACTIVITY_CONFIG } from "@/app/(app)/_components/log/log-activity-config";

describe("LOG_ACTIVITY_CONFIG", () => {
  it("includes water, calories, sleep, and steps presets", () => {
    expect(LOG_ACTIVITY_CONFIG.water.label).toBe("Water");
    expect(LOG_ACTIVITY_CONFIG.calories.label).toBe("Calories");
    expect(LOG_ACTIVITY_CONFIG.sleep).toEqual({
      apiType: "custom",
      label: "Sleep",
      unit: "hrs",
      valuePlaceholder: "Enter hours slept",
    });
    expect(LOG_ACTIVITY_CONFIG.steps).toEqual({
      apiType: "custom",
      label: "Steps",
      unit: "steps",
      valuePlaceholder: "Enter step count",
    });
  });
});
