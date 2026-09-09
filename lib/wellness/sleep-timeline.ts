import type { SleepDataPoint } from "@/lib/zealthy";
import type { SleepSegment, SleepStage, SleepTimeline } from "@/types/wellness";

const INTERVAL_MINUTES = 10;
const NIGHT_BOUNDARY_AWAKE = 18;
const WAKE_TAIL_AWAKE = 6;
const MIN_OVERNIGHT_MINUTES = 180;
const MIN_SESSION_MINUTES = 60;
const TRAILING_EDGE_INTERVALS = 6;
const MIN_COMPLETE_NIGHT_MINUTES = 240;

export const SLEEP_STAGE_COLORS: Record<SleepStage, string> = {
  awake: "#ff8a65",
  rem: "#5eead4",
  core: "#818cf8",
  deep: "#6366f1",
};

export const SLEEP_STAGE_LABELS: Record<SleepStage, string> = {
  awake: "Awake",
  rem: "REM",
  core: "Core",
  deep: "Deep",
};

export function inferSleepStage(sleepMinutes: number): SleepStage {
  if (sleepMinutes <= 0) return "awake";
  if (sleepMinutes <= 3) return "rem";
  if (sleepMinutes <= 7) return "core";
  return "deep";
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatClockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function segmentEnd(startIso: string) {
  return new Date(new Date(startIso).getTime() + INTERVAL_MINUTES * 60_000).toISOString();
}

function touchesPreviousSegment(previousEnd: string, nextStart: string) {
  return new Date(previousEnd).getTime() === new Date(nextStart).getTime();
}

function asleepMinutesInRange(sorted: SleepDataPoint[], startIdx: number, endIdx: number) {
  let total = 0;
  for (let index = startIdx; index <= endIdx; index += 1) {
    total += sorted[index]?.sleepMinutes ?? 0;
  }
  return total;
}

type SleepSession = {
  startIdx: number;
  endIdx: number;
  asleepMinutes: number;
};

function splitSleepSessions(sorted: SleepDataPoint[]): SleepSession[] {
  const sessions: SleepSession[] = [];
  let inSession = false;
  let startIdx = 0;
  let lastAsleepIdx = -1;
  let awakeStreak = 0;

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index].sleepMinutes > 0) {
      if (!inSession) {
        inSession = true;
        startIdx = index;
      }
      lastAsleepIdx = index;
      awakeStreak = 0;
      continue;
    }

    if (!inSession) continue;

    awakeStreak += 1;
    if (awakeStreak >= NIGHT_BOUNDARY_AWAKE) {
      sessions.push({
        startIdx,
        endIdx: lastAsleepIdx,
        asleepMinutes: asleepMinutesInRange(sorted, startIdx, lastAsleepIdx),
      });
      inSession = false;
      awakeStreak = 0;
    }
  }

  if (inSession && lastAsleepIdx >= startIdx) {
    sessions.push({
      startIdx,
      endIdx: lastAsleepIdx,
      asleepMinutes: asleepMinutesInRange(sorted, startIdx, lastAsleepIdx),
    });
  }

  return sessions;
}

function isTrailingPartialSession(sorted: SleepDataPoint[], session: SleepSession) {
  const nearDatasetEnd = session.endIdx >= sorted.length - TRAILING_EDGE_INTERVALS;
  return nearDatasetEnd && session.asleepMinutes < MIN_COMPLETE_NIGHT_MINUTES;
}

function findLatestMeaningfulSession(sorted: SleepDataPoint[]) {
  const sessions = splitSleepSessions(sorted);
  if (sessions.length === 0) return null;

  const completeOvernight = sessions.filter(
    (session) =>
      session.asleepMinutes >= MIN_OVERNIGHT_MINUTES &&
      !isTrailingPartialSession(sorted, session),
  );
  if (completeOvernight.length > 0) return completeOvernight.at(-1)!;

  const completeNaps = sessions.filter(
    (session) =>
      session.asleepMinutes >= MIN_SESSION_MINUTES &&
      !isTrailingPartialSession(sorted, session),
  );
  if (completeNaps.length > 0) return completeNaps.at(-1)!;

  const fallback = sessions.filter((session) => session.asleepMinutes >= MIN_SESSION_MINUTES);
  return fallback.at(-1) ?? sessions.at(-1) ?? null;
}

function expandNightEnd(sorted: SleepDataPoint[], lastAsleep: number) {
  let end = lastAsleep;
  let awakeRun = 0;

  for (let index = lastAsleep + 1; index < sorted.length; index += 1) {
    if (sorted[index].sleepMinutes > 0) {
      end = index;
      awakeRun = 0;
      continue;
    }

    awakeRun += 1;
    if (awakeRun > WAKE_TAIL_AWAKE) break;
    end = index;
  }

  return end;
}

function intervalGapMinutes(previous: SleepDataPoint, next: SleepDataPoint) {
  return (
    (new Date(next.timestamp).getTime() - new Date(previous.timestamp).getTime()) /
    60_000
  );
}

function isContiguousInterval(previous: SleepDataPoint, next: SleepDataPoint) {
  const gap = intervalGapMinutes(previous, next);
  return gap > 0 && gap <= INTERVAL_MINUTES * 2;
}

function findAwakeRunBackward(sorted: SleepDataPoint[], fromIndex: number) {
  let end = fromIndex;
  let start = fromIndex;

  while (start > 0 && sorted[start - 1].sleepMinutes === 0) {
    if (!isContiguousInterval(sorted[start - 1], sorted[start])) break;
    start -= 1;
  }

  return {
    start,
    end,
    length: end - start + 1,
  };
}

function findNightStart(sorted: SleepDataPoint[], lastAsleep: number) {
  let start = lastAsleep;
  let index = lastAsleep;

  while (index >= 0) {
    while (index >= 0 && sorted[index].sleepMinutes > 0) {
      start = index;
      index -= 1;
    }

    if (index < 0) break;

    const { start: awakeStart, end: awakeEnd, length } = findAwakeRunBackward(sorted, index);

    if (length >= NIGHT_BOUNDARY_AWAKE) {
      return awakeEnd + 1;
    }

    start = awakeStart;
    index = awakeStart - 1;
  }

  return start;
}

export function latestNightPoints(data: SleepDataPoint[]) {
  const sorted = [...data].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (sorted.length === 0) return [];

  const session = findLatestMeaningfulSession(sorted);
  if (!session) return [];

  const start = findNightStart(sorted, session.endIdx);
  const end = expandNightEnd(sorted, session.endIdx);

  return sorted.slice(start, end + 1);
}

export function buildSleepSegments(points: SleepDataPoint[]): SleepSegment[] {
  if (points.length === 0) return [];

  const segments: SleepSegment[] = [];

  for (const point of points) {
    const stage = inferSleepStage(point.sleepMinutes);
    const end = segmentEnd(point.timestamp);
    const previous = segments.at(-1);

    if (previous && previous.stage === stage && touchesPreviousSegment(previous.end, point.timestamp)) {
      previous.end = end;
      previous.minutes += INTERVAL_MINUTES;
      continue;
    }

    segments.push({
      stage,
      start: point.timestamp,
      end,
      minutes: INTERVAL_MINUTES,
    });
  }

  return segments;
}

export function buildSleepTimeline(data: SleepDataPoint[]): SleepTimeline | null {
  const points = latestNightPoints(data);
  if (points.length === 0) return null;

  const segments = buildSleepSegments(points);
  const stageTotals: Record<SleepStage, number> = {
    awake: 0,
    rem: 0,
    core: 0,
    deep: 0,
  };

  for (const segment of segments) {
    stageTotals[segment.stage] += segment.minutes;
  }

  const asleepMinutes = stageTotals.rem + stageTotals.core + stageTotals.deep;
  if (asleepMinutes === 0) return null;

  const start = points[0].timestamp;
  const end = segmentEnd(points.at(-1)!.timestamp);

  return {
    date: points[0].timestamp.slice(0, 10),
    totalMinutes: asleepMinutes,
    totalLabel: formatDuration(asleepMinutes),
    startLabel: formatClockTime(start),
    endLabel: formatClockTime(end),
    segments,
    stageTotals,
  };
}
