export type SectionMetric = {
  label: string;
  value: string;
  detail: string;
  tone?: "calm" | "steady" | "attention";
};

export type ChartPoint = {
  label: string;
  value: number | null;
};

export type ChartOverviewPoint = {
  label: string;
  mood: number | null;
  water: number | null;
};

export type MetricChart = {
  title: string;
  subtitle: string;
  color: string;
  unit?: string;
  points: ChartPoint[];
};

export type SleepStage = "awake" | "rem" | "core" | "deep";

export type SleepSegment = {
  stage: SleepStage;
  start: string;
  end: string;
  minutes: number;
};

export type SleepTimeline = {
  date: string;
  totalMinutes: number;
  totalLabel: string;
  startLabel: string;
  endLabel: string;
  segments: SleepSegment[];
  stageTotals: Record<SleepStage, number>;
};

export type DashboardData = {
  sleep: SectionMetric[];
  mental: SectionMetric[];
  physical: SectionMetric[];
  sleepTimeline: SleepTimeline | null;
  chartOverview: ChartOverviewPoint[];
  chartByMetric: Record<string, MetricChart>;
};

export type WellnessAccent = "sleep" | "mental" | "physical";

export type BodyRegion = "head" | "chest" | "core" | "legs";

export const CHART_COLORS: Record<WellnessAccent, string> = {
  sleep: "#6366f1",
  mental: "#8b5cf6",
  physical: "#0ea5e9",
};
