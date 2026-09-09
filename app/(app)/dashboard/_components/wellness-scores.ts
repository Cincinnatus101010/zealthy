import type { DashboardData } from "@/types/wellness";

export type WellnessScore = {
  id: string;
  label: string;
  value: string;
  accent: "accent" | "sleep" | "mental" | "physical";
};

function parseScore(value: string): string {
  if (value === "—") return "—";

  const percent = value.match(/^(\d+(?:\.\d+)?)\s*%/);
  if (percent) return String(Math.round(Number(percent[1])));

  const leadingNumber = value.match(/^(\d+(?:\.\d+)?)/);
  if (!leadingNumber) return value.slice(0, 3);

  const numeric = Number(leadingNumber[1]);
  if (value.includes("kcal") || value.includes("steps") || numeric > 500) {
    return String(Math.min(99, Math.round(numeric / 100)));
  }
  if (numeric <= 10) return String(Math.round(numeric * 10));
  if (numeric <= 24) return String(Math.min(99, Math.round(numeric * 11)));
  return String(Math.min(99, Math.round(numeric)));
}

function trendsScore(data: DashboardData): string {
  const moods = data.chartOverview
    .map((point) => point.mood)
    .filter((value): value is number => value !== null);
  const waters = data.chartOverview
    .map((point) => point.water)
    .filter((value): value is number => value !== null);

  const moodAvg = moods.length
    ? moods.reduce((sum, value) => sum + value, 0) / moods.length
    : null;
  const waterAvg = waters.length
    ? waters.reduce((sum, value) => sum + value, 0) / waters.length
    : null;

  if (moodAvg !== null && waterAvg !== null) {
    return String(Math.min(99, Math.round(moodAvg * 9 + waterAvg * 1.5)));
  }
  if (moodAvg !== null) return String(Math.min(99, Math.round(moodAvg * 10)));
  if (waterAvg !== null) return String(Math.min(99, Math.round(waterAvg * 10)));
  return "—";
}

export function buildWellnessScores(data: DashboardData): WellnessScore[] {
  const activity = data.physical.find((metric) => metric.label === "Activity");
  const sleep = data.sleep[0];
  const mood = data.mental.find((metric) => metric.label === "Mood");
  const steps = data.physical.find((metric) => metric.label === "Steps");

  return [
    {
      id: "readiness",
      label: "Readiness",
      value: parseScore(activity?.value ?? "—"),
      accent: "accent",
    },
    {
      id: "sleep",
      label: "Sleep",
      value: parseScore(sleep?.value ?? "—"),
      accent: "sleep",
    },
    {
      id: "activity",
      label: "Activity",
      value: parseScore(steps?.value ?? activity?.value ?? "—"),
      accent: "physical",
    },
    {
      id: "trends",
      label: "Trends",
      value: trendsScore(data),
      accent: "accent",
    },
    {
      id: "mood",
      label: "Mood",
      value: parseScore(mood?.value ?? "—"),
      accent: "mental",
    },
  ];
}
