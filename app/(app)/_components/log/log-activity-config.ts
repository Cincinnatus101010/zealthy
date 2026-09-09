export const LOG_ACTIVITY_KEYS = ["water", "calories", "sleep", "steps", "custom"] as const;

export type LogActivityKey = (typeof LOG_ACTIVITY_KEYS)[number];

export const LOG_ACTIVITY_CONFIG = {
  water: {
    apiType: "water" as const,
    label: "Water",
    unit: "glasses",
    valuePlaceholder: "Enter glasses",
  },
  calories: {
    apiType: "calories" as const,
    label: "Calories",
    unit: "kcal",
    valuePlaceholder: "Enter kcal",
  },
  sleep: {
    apiType: "custom" as const,
    label: "Sleep",
    unit: "hrs",
    valuePlaceholder: "Enter hours slept",
  },
  steps: {
    apiType: "custom" as const,
    label: "Steps",
    unit: "steps",
    valuePlaceholder: "Enter step count",
  },
  custom: {
    apiType: "custom" as const,
    label: "Custom activity",
    unit: "",
    valuePlaceholder: "Enter value",
  },
} satisfies Record<
  LogActivityKey,
  {
    apiType: "water" | "calories" | "custom";
    label: string;
    unit: string;
    valuePlaceholder: string;
  }
>;

export function isLogActivityKey(value: string): value is LogActivityKey {
  return LOG_ACTIVITY_KEYS.includes(value as LogActivityKey);
}
