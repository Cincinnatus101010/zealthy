import { prisma } from "@/lib/db";
import { fetchZealthyMetrics } from "@/lib/wellness/zealthy-metrics";
import type {
  ChartOverviewPoint,
  ChartPoint,
  DashboardData,
  MetricChart,
  SectionMetric,
  WellnessAccent,
} from "@/types/wellness";
import { CHART_COLORS } from "@/types/wellness";

export type { DashboardData, SectionMetric } from "@/types/wellness";

function formatLatestEntry(
  entries: { value: number; unit: string | null; date: Date }[],
) {
  if (entries.length === 0) return null;
  const latest = entries[0];
  const unit = latest.unit ? ` ${latest.unit}` : "";
  return `${latest.value}${unit}`;
}

function placeholder(label: string, detail: string): SectionMetric {
  return { label, value: "—", detail, tone: "steady" };
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function recentValues(entries: { value: number; date: Date }[], days = 7) {
  return entries.slice(0, days).map((entry) => entry.value);
}

function hydrationTone(glasses: number | undefined): SectionMetric["tone"] {
  if (!glasses) return "steady";
  if (glasses >= 8) return "calm";
  if (glasses >= 6) return "steady";
  return "attention";
}

function activityScore(
  waterEntries: { value: number; date: Date }[],
  calorieEntries: { value: number; date: Date }[],
) {
  const waterDays = waterEntries.filter((entry) => entry.value >= 6).length;
  const calorieDays = calorieEntries.filter((entry) => entry.value >= 1700).length;
  const score = Math.round(((waterDays + calorieDays) / 14) * 100);
  return Math.min(100, Math.max(0, score));
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    date.setUTCHours(0, 0, 0, 0);
    return { key: date.toISOString().slice(0, 10), label: formatDayLabel(date) };
  });
}

function chartPoints(valuesByDay: Map<string, number>): ChartPoint[] {
  return lastSevenDays().map(({ key, label }) => ({
    label,
    value: valuesByDay.get(key) ?? null,
  }));
}

function chartPointsFromEntries(entries: { value: number; date: Date }[]) {
  const byDay = new Map(
    entries.map((entry) => [entry.date.toISOString().slice(0, 10), entry.value]),
  );
  return chartPoints(byDay);
}

function chartPointsFromDailySeries(
  series: { date: string; value: number }[],
): ChartPoint[] {
  return chartPoints(new Map(series.map((item) => [item.date, item.value])));
}

function mergeChartPoints(
  zealthySeries: { date: string; value: number }[] | undefined,
  entries: { value: number; date: Date }[],
): ChartPoint[] {
  const byDay = new Map<string, number>();

  for (const point of zealthySeries ?? []) {
    byDay.set(point.date, point.value);
  }

  for (const entry of entries) {
    byDay.set(entry.date.toISOString().slice(0, 10), entry.value);
  }

  return chartPoints(byDay);
}


function buildStepsMetric(
  stepEntries: { value: number; unit: string | null; date: Date }[],
  zealthySteps?: SectionMetric,
): SectionMetric {
  const latestLogged = formatLatestEntry(stepEntries);
  if (latestLogged) {
    const latest = stepEntries[0]?.value ?? 0;
    return {
      label: "Steps",
      value: latestLogged,
      detail: "Latest logged entry",
      tone: latest >= 8000 ? "calm" : "steady",
    };
  }

  if (zealthySteps) return zealthySteps;

  return placeholder("Steps", "Log steps or sync from Zealthy API");
}

function buildSleepMetrics(
  sleepLogEntries: { value: number; unit: string | null; date: Date }[],
  zealthySleep?: SectionMetric[],
): SectionMetric[] {
  const latestLogged = formatLatestEntry(sleepLogEntries);
  if (!latestLogged) {
    return zealthySleep ?? defaultSleep;
  }

  const base = zealthySleep ?? defaultSleep;
  const latest = sleepLogEntries[0]?.value ?? 0;

  return base.map((metric, index) =>
    index === 0
      ? {
          label: "Sleep",
          value: latestLogged,
          detail: "Latest logged entry",
          tone: latest >= 7 ? "calm" : "steady",
        }
      : metric,
  );
}

function buildChartOverview(
  moodEntries: { value: number; date: Date }[],
  waterEntries: { value: number; date: Date }[],
): ChartOverviewPoint[] {
  const moodByDay = new Map(
    moodEntries.map((entry) => [entry.date.toISOString().slice(0, 10), entry.value]),
  );
  const waterByDay = new Map(
    waterEntries.map((entry) => [entry.date.toISOString().slice(0, 10), entry.value]),
  );

  return lastSevenDays().map(({ key, label }) => ({
    label,
    mood: moodByDay.get(key) ?? null,
    water: waterByDay.get(key) ?? null,
  }));
}

function metricChart(
  accent: WellnessAccent,
  title: string,
  subtitle: string,
  points: ChartPoint[],
  unit?: string,
): MetricChart {
  return { title, subtitle, color: CHART_COLORS[accent], unit, points };
}

function setChart(
  charts: Record<string, MetricChart>,
  accent: WellnessAccent,
  label: string,
  chart: MetricChart,
) {
  charts[`${accent}:${label}`] = chart;
}

const defaultOverview: ChartOverviewPoint[] = lastSevenDays().map(({ label }) => ({
  label,
  mood: null,
  water: null,
}));

const defaultSleep: SectionMetric[] = [
  placeholder("Sleep", "Last night from Zealthy API"),
  placeholder("Sleep debt", "Rolling 7-day balance"),
  placeholder("Bedtime", "First sleep interval last night"),
  placeholder("Quality", "Deep sleep intervals"),
];

export async function getDashboardData(email: string): Promise<DashboardData> {
  const [zealthy, user] = await Promise.all([
    fetchZealthyMetrics(email).catch(() => null),
    prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { wellnessEntries: { orderBy: { date: "desc" } } },
    }),
  ]);

  const moodEntries = user?.wellnessEntries.filter((entry) => entry.label === "Mood") ?? [];
  const meditationEntries =
    user?.wellnessEntries.filter((entry) => entry.label === "Meditation") ?? [];
  const waterEntries = user?.wellnessEntries.filter((entry) => entry.type === "water") ?? [];
  const calorieEntries =
    user?.wellnessEntries.filter((entry) => entry.type === "calories") ?? [];
  const stepEntries = user?.wellnessEntries.filter((entry) => entry.label === "Steps") ?? [];
  const sleepLogEntries =
    user?.wellnessEntries.filter((entry) => entry.label === "Sleep") ?? [];

  const latestMood = formatLatestEntry(moodEntries);
  const latestMeditation = formatLatestEntry(meditationEntries);
  const latestWater = formatLatestEntry(waterEntries);
  const latestCalories = formatLatestEntry(calorieEntries);
  const waterToday = waterEntries[0]?.value;
  const calorieToday = calorieEntries[0]?.value;
  const waterAvg = average(recentValues(waterEntries));
  const calorieAvg = average(recentValues(calorieEntries));
  const hydrationGoal = 8;
  const hydrationPct = waterToday ? Math.round((waterToday / hydrationGoal) * 100) : null;
  const score = activityScore(waterEntries, calorieEntries);

  const chartByMetric: Record<string, MetricChart> = {};
  const moodPoints = chartPointsFromEntries(moodEntries);
  const meditationPoints = chartPointsFromEntries(meditationEntries);
  const waterPoints = chartPointsFromEntries(waterEntries);
  const caloriePoints = chartPointsFromEntries(calorieEntries);
  const stepPoints = mergeChartPoints(
    zealthy?.stepsByDay.map((day) => ({ date: day.date, value: day.steps })),
    stepEntries,
  );
  const sleepLogPoints = mergeChartPoints(
    zealthy?.sleepByDay.map((day) => ({ date: day.date, value: day.sleepHours })),
    sleepLogEntries,
  );

  if (zealthy) {
    const qualityPoints = chartPointsFromDailySeries(zealthy.qualityByDay);

    setChart(
      chartByMetric,
      "sleep",
      "Sleep",
      metricChart("sleep", "Sleep", "Hours per night", sleepLogPoints, "hrs"),
    );
    setChart(
      chartByMetric,
      "sleep",
      "Sleep debt",
      metricChart("sleep", "Sleep debt", "Hours per night", sleepLogPoints, "hrs"),
    );
    setChart(
      chartByMetric,
      "sleep",
      "Bedtime",
      metricChart("sleep", "Bedtime", "Hours per night", sleepLogPoints, "hrs"),
    );
    setChart(
      chartByMetric,
      "sleep",
      "Quality",
      metricChart("sleep", "Quality", "Deep sleep %", qualityPoints, "%"),
    );
  } else if (sleepLogEntries.length > 0) {
    setChart(
      chartByMetric,
      "sleep",
      "Sleep",
      metricChart("sleep", "Sleep", "Hours per night", sleepLogPoints, "hrs"),
    );
  }

  setChart(
    chartByMetric,
    "physical",
    "Steps",
    metricChart("physical", "Steps", "Daily step count", stepPoints),
  );

  setChart(
    chartByMetric,
    "mental",
    "Mood",
    metricChart("mental", "Mood", "Daily mood score", moodPoints),
  );
  setChart(
    chartByMetric,
    "mental",
    "Meditation",
    metricChart("mental", "Meditation", "Minutes practiced", meditationPoints, "min"),
  );
  setChart(
    chartByMetric,
    "mental",
    "Stress",
    metricChart("mental", "Stress", "Mood score proxy", moodPoints),
  );
  setChart(
    chartByMetric,
    "mental",
    "Check-ins",
    metricChart("mental", "Check-ins", "Mood score", moodPoints),
  );
  setChart(
    chartByMetric,
    "physical",
    "Water",
    metricChart("physical", "Water", "Glasses per day", waterPoints, "glasses"),
  );
  setChart(
    chartByMetric,
    "physical",
    "Calories",
    metricChart("physical", "Calories", "Daily intake", caloriePoints, "kcal"),
  );
  setChart(
    chartByMetric,
    "physical",
    "Activity",
    metricChart(
      "physical",
      "Activity",
      stepEntries.length > 0 || zealthy ? "Daily step count" : "Hydration trend",
      stepEntries.length > 0 || zealthy ? stepPoints : waterPoints,
      stepEntries.length > 0 || zealthy ? undefined : "glasses",
    ),
  );

  const stepsMetric = buildStepsMetric(stepEntries, zealthy?.steps);
  const sleepMetrics = buildSleepMetrics(sleepLogEntries, zealthy?.sleep);

  return {
    sleep: sleepMetrics,
    mental: [
      {
        label: "Mood",
        value: latestMood ?? "—",
        detail: "How you felt today",
        tone: moodEntries[0]?.value && moodEntries[0].value >= 7 ? "calm" : "steady",
      },
      {
        label: "Meditation",
        value: latestMeditation ?? "—",
        detail: "Mindfulness practice",
        tone: meditationEntries.length > 0 ? "calm" : "steady",
      },
      {
        label: "Stress",
        value: moodEntries[0] ? (moodEntries[0].value >= 6 ? "Low" : "Elevated") : "—",
        detail: "Derived from recent mood",
        tone: moodEntries[0] && moodEntries[0].value < 6 ? "attention" : "calm",
      },
      {
        label: "Check-ins",
        value: String(moodEntries.length + meditationEntries.length),
        detail: "Logged mental health entries",
        tone: "steady",
      },
    ],
    physical: [
      stepsMetric,
      {
        label: "Water",
        value: latestWater ?? "—",
        detail: hydrationPct
          ? `${hydrationPct}% of ${hydrationGoal}-glass goal`
          : "Hydration today",
        tone: hydrationTone(waterToday),
      },
      {
        label: "Calories",
        value: latestCalories ?? "—",
        detail: calorieAvg
          ? `7-day avg ${Math.round(calorieAvg)} kcal`
          : "Nutrition today",
        tone:
          calorieToday && calorieToday >= 1700 && calorieToday <= 2300
            ? "calm"
            : "steady",
      },
      {
        label: "Activity",
        value: waterEntries.length > 0 ? `${score}%` : "—",
        detail:
          waterAvg !== null
            ? `Avg ${waterAvg.toFixed(1)} glasses · weekly balance`
            : "Weekly movement snapshot",
        tone: score >= 70 ? "calm" : score >= 45 ? "steady" : "attention",
      },
    ],
    sleepTimeline: zealthy?.sleepTimeline ?? null,
    chartOverview: buildChartOverview(moodEntries, waterEntries),
    chartByMetric,
  };
}

export function getDefaultDashboardData(): DashboardData {
  return {
    sleep: defaultSleep,
    mental: [
      placeholder("Mood", "How you felt today"),
      placeholder("Meditation", "Mindfulness practice"),
      placeholder("Stress", "Derived from recent mood"),
      { label: "Check-ins", value: "0", detail: "Logged mental health entries", tone: "steady" },
    ],
    physical: [
      placeholder("Steps", "Latest day from Zealthy API"),
      placeholder("Water", "8-glass hydration goal"),
      placeholder("Calories", "7-day nutrition average"),
      placeholder("Activity", "Weekly movement snapshot"),
    ],
    sleepTimeline: null,
    chartOverview: defaultOverview,
    chartByMetric: {},
  };
}
