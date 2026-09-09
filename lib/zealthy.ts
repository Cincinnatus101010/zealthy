const ZEALTHY_API_URL =
  process.env.ZEALTHY_API_URL ??
  "https://zealthy-personal-wellness-tracker-a.vercel.app";

export type SleepDataPoint = {
  timestamp: string;
  sleepMinutes: number;
};

export type StepDataPoint = {
  timestamp: string;
  stepCount: number;
};

export type ZealthySleepResponse = {
  user: { email: string };
  data: SleepDataPoint[];
};

export type ZealthyStepsResponse = {
  user: { email: string };
  data: StepDataPoint[];
};

type TimeRangeParams = {
  email: string;
  startTime?: string;
  endTime?: string;
};

function buildUrl(path: string, params: TimeRangeParams) {
  const url = new URL(path, ZEALTHY_API_URL);
  url.searchParams.set("email", params.email);
  if (params.startTime) url.searchParams.set("startTime", params.startTime);
  if (params.endTime) url.searchParams.set("endTime", params.endTime);
  return url.toString();
}

export async function fetchSleepData(params: TimeRangeParams) {
  const response = await fetch(buildUrl("/sleep_data", params), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sleep data: ${response.status}`);
  }

  return (await response.json()) as ZealthySleepResponse;
}

export async function fetchStepData(params: TimeRangeParams) {
  const response = await fetch(buildUrl("/step_data", params), {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch step data: ${response.status}`);
  }

  return (await response.json()) as ZealthyStepsResponse;
}

export function aggregateSleepByDay(data: SleepDataPoint[]) {
  const byDay = new Map<string, number>();

  for (const point of data) {
    const day = point.timestamp.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + point.sleepMinutes);
  }

  return [...byDay.entries()]
    .map(([date, sleepMinutes]) => ({
      date,
      sleepHours: Number((sleepMinutes / 60).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateStepsByDay(data: StepDataPoint[]) {
  const byDay = new Map<string, number>();

  for (const point of data) {
    const day = point.timestamp.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + point.stepCount);
  }

  return [...byDay.entries()]
    .map(([date, steps]) => ({ date, steps }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
