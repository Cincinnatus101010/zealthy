import { describe, expect, it } from "vitest";
import {
  buildSleepSegments,
  buildSleepTimeline,
  inferSleepStage,
  latestNightPoints,
} from "@/lib/wellness/sleep-timeline";

describe("inferSleepStage", () => {
  it("maps sleep minutes to Apple-style stages", () => {
    expect(inferSleepStage(0)).toBe("awake");
    expect(inferSleepStage(3)).toBe("rem");
    expect(inferSleepStage(7)).toBe("core");
    expect(inferSleepStage(10)).toBe("deep");
  });
});

describe("buildSleepTimeline", () => {
  it("builds a merged hypnogram for the latest night", () => {
    const timeline = buildSleepTimeline([
      { timestamp: "2026-09-08T22:00:00Z", sleepMinutes: 0 },
      { timestamp: "2026-09-08T22:10:00Z", sleepMinutes: 0 },
      { timestamp: "2026-09-08T22:20:00Z", sleepMinutes: 9 },
      { timestamp: "2026-09-08T22:30:00Z", sleepMinutes: 10 },
      { timestamp: "2026-09-08T22:40:00Z", sleepMinutes: 7 },
      { timestamp: "2026-09-08T22:50:00Z", sleepMinutes: 10 },
      { timestamp: "2026-09-08T23:00:00Z", sleepMinutes: 0 },
    ]);

    expect(timeline).toMatchObject({
      date: "2026-09-08",
      totalMinutes: 40,
      totalLabel: "40m",
      stageTotals: {
        awake: 30,
        rem: 0,
        core: 10,
        deep: 30,
      },
    });
    expect(timeline?.segments).toHaveLength(5);
  });

  it("returns null when there is no asleep time", () => {
    expect(
      buildSleepTimeline([{ timestamp: "2026-09-08T22:00:00Z", sleepMinutes: 0 }]),
    ).toBeNull();
  });
});

describe("latestNightPoints", () => {
  it("isolates the most recent night from multi-day data", () => {
    const dayAwake = Array.from({ length: 18 }, (_, index) => ({
      timestamp: `2026-09-08T${String(Math.floor(index / 6)).padStart(2, "0")}:${String((index % 6) * 10).padStart(2, "0")}:00Z`,
      sleepMinutes: 0,
    }));

    const points = latestNightPoints([
      ...dayAwake,
      { timestamp: "2026-09-08T22:00:00Z", sleepMinutes: 0 },
      { timestamp: "2026-09-08T22:10:00Z", sleepMinutes: 9 },
      { timestamp: "2026-09-08T22:20:00Z", sleepMinutes: 10 },
      { timestamp: "2026-09-09T06:00:00Z", sleepMinutes: 0 },
      { timestamp: "2026-09-09T06:10:00Z", sleepMinutes: 0 },
    ]);

    expect(points.map((point) => point.timestamp)).toEqual([
      "2026-09-08T22:00:00Z",
      "2026-09-08T22:10:00Z",
      "2026-09-08T22:20:00Z",
      "2026-09-09T06:00:00Z",
      "2026-09-09T06:10:00Z",
    ]);
  });

  it("ignores a short trailing nap when a full night exists earlier", () => {
    const dayAwake = Array.from({ length: 18 }, (_, index) => ({
      timestamp: `2026-09-09T${String(Math.floor(index / 6)).padStart(2, "0")}:${String((index % 6) * 10).padStart(2, "0")}:00Z`,
      sleepMinutes: 0,
    }));

    const mainNight = Array.from({ length: 36 }, (_, index) => ({
      timestamp: new Date(Date.parse("2026-09-08T22:10:00Z") + index * 10 * 60_000).toISOString(),
      sleepMinutes: 9,
    }));

    const timeline = buildSleepTimeline([
      ...dayAwake,
      { timestamp: "2026-09-08T22:00:00Z", sleepMinutes: 0 },
      ...mainNight,
      { timestamp: "2026-09-09T06:00:00Z", sleepMinutes: 0 },
      { timestamp: "2026-09-09T06:10:00Z", sleepMinutes: 0 },
      ...dayAwake,
      { timestamp: "2026-09-09T22:00:00Z", sleepMinutes: 9 },
      { timestamp: "2026-09-09T22:10:00Z", sleepMinutes: 5 },
      { timestamp: "2026-09-09T22:20:00Z", sleepMinutes: 3 },
    ]);

    expect(timeline?.totalMinutes).toBeGreaterThanOrEqual(180);
    expect(timeline?.totalLabel).not.toBe("30m");
    expect(timeline?.totalLabel).not.toBe("1h 40m");
  });

  it("skips a trailing partial evening when an earlier full night exists", () => {
    const fullNight = Array.from({ length: 66 }, (_, index) => ({
      timestamp: new Date(Date.parse("2026-09-08T22:00:00Z") + index * 10 * 60_000).toISOString(),
      sleepMinutes: index === 0 || index === 65 ? 0 : 9,
    }));

    const dayAwake = Array.from({ length: 84 }, (_, index) => ({
      timestamp: new Date(Date.parse("2026-09-09T09:00:00Z") + index * 10 * 60_000).toISOString(),
      sleepMinutes: 0,
    }));

    const trailingPartial = Array.from({ length: 10 }, (_, index) => ({
      timestamp: new Date(Date.parse("2026-09-09T22:00:00Z") + index * 10 * 60_000).toISOString(),
      sleepMinutes: index === 0 ? 0 : 8,
    }));

    const timeline = buildSleepTimeline([...fullNight, ...dayAwake, ...trailingPartial]);

    expect(timeline?.totalMinutes).toBeGreaterThanOrEqual(360);
    expect(timeline?.startLabel).toContain("PM");
  });
});

describe("buildSleepSegments", () => {
  it("merges consecutive intervals with the same stage", () => {
    const segments = buildSleepSegments([
      { timestamp: "2026-09-08T22:00:00Z", sleepMinutes: 9 },
      { timestamp: "2026-09-08T22:10:00Z", sleepMinutes: 10 },
      { timestamp: "2026-09-08T22:20:00Z", sleepMinutes: 0 },
    ]);

    expect(segments).toEqual([
      {
        stage: "deep",
        start: "2026-09-08T22:00:00Z",
        end: "2026-09-08T22:20:00.000Z",
        minutes: 20,
      },
      {
        stage: "awake",
        start: "2026-09-08T22:20:00Z",
        end: "2026-09-08T22:30:00.000Z",
        minutes: 10,
      },
    ]);
  });
});
