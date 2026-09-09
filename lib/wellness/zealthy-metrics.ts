import {
  aggregateSleepByDay,
  aggregateStepsByDay,
  fetchSleepData,
  fetchStepData,
  type SleepDataPoint,
} from "@/lib/zealthy";
import { buildSleepTimeline } from "@/lib/wellness/sleep-timeline";
import type { SectionMetric } from "@/types/wellness";

const SLEEP_GOAL_HOURS = 8;

function sevenDayRange(email: string) {
  return {
    email,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

function formatHours(hours: number) {
  return `${hours.toFixed(1)} hrs`;
}

function formatSteps(steps: number) {
  return steps.toLocaleString("en-US");
}

function latestDay<T extends { date: string }>(series: T[]) {
  return series.at(-1) ?? null;
}

function sleepDebtHours(sleepByDay: { sleepHours: number }[]) {
  return sleepByDay.reduce((debt, day) => debt + (SLEEP_GOAL_HOURS - day.sleepHours), 0);
}

function estimateBedtime(rawSleep: SleepDataPoint[], day: string) {
  const first = rawSleep.find(
    (point) => point.timestamp.startsWith(day) && point.sleepMinutes > 0,
  );
  if (!first) return null;

  return new Date(first.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function sleepQuality(rawSleep: SleepDataPoint[], day: string) {
  const intervals = rawSleep.filter((point) => point.timestamp.startsWith(day));
  if (intervals.length === 0) return null;

  const deep = intervals.filter((point) => point.sleepMinutes >= 8).length;
  return Math.round((deep / intervals.length) * 100);
}

export async function fetchZealthyMetrics(email: string) {
  const range = sevenDayRange(email);
  const [sleepResponse, stepsResponse] = await Promise.all([
    fetchSleepData(range),
    fetchStepData(range),
  ]);

  const sleepByDay = aggregateSleepByDay(sleepResponse.data);
  const stepsByDay = aggregateStepsByDay(stepsResponse.data);
  const latestSleep = latestDay(sleepByDay);
  const latestSteps = latestDay(stepsByDay);
  const debt = sleepDebtHours(sleepByDay);
  const latestDayKey = latestSleep?.date ?? "";
  const bedtime = latestDayKey ? estimateBedtime(sleepResponse.data, latestDayKey) : null;
  const quality = latestDayKey ? sleepQuality(sleepResponse.data, latestDayKey) : null;

  return {
    sleepByDay,
    stepsByDay,
    sleepTimeline: buildSleepTimeline(sleepResponse.data),
    qualityByDay: sleepByDay.map(({ date }) => ({
      date,
      value: sleepQuality(sleepResponse.data, date) ?? 0,
    })),
    sleep: [
      {
        label: "Sleep",
        value: latestSleep ? formatHours(latestSleep.sleepHours) : "—",
        detail: "Last night from Zealthy API",
        tone: latestSleep && latestSleep.sleepHours >= 7 ? "calm" : "steady",
      },
      {
        label: "Sleep debt",
        value: sleepByDay.length ? `${debt >= 0 ? "+" : ""}${debt.toFixed(1)}h` : "—",
        detail: "Rolling 7-day balance vs 8h goal",
        tone: debt <= 0 ? "calm" : debt <= 3 ? "steady" : "attention",
      },
      {
        label: "Bedtime",
        value: bedtime ?? "—",
        detail: "First sleep interval last night",
        tone: "steady",
      },
      {
        label: "Quality",
        value: quality !== null ? `${quality}%` : "—",
        detail: "Deep sleep intervals",
        tone: quality !== null && quality >= 60 ? "calm" : "steady",
      },
    ] satisfies SectionMetric[],
    steps: {
      label: "Steps",
      value: latestSteps ? formatSteps(latestSteps.steps) : "—",
      detail: "Latest day from Zealthy API",
      tone: latestSteps && latestSteps.steps >= 8000 ? "calm" : "steady",
    } satisfies SectionMetric,
  };
}
