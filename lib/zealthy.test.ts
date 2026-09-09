import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  aggregateSleepByDay,
  aggregateStepsByDay,
  fetchSleepData,
  fetchStepData,
} from "@/lib/zealthy";

describe("aggregateSleepByDay", () => {
  it("sums sleep minutes per day and converts to hours", () => {
    const result = aggregateSleepByDay([
      { timestamp: "2026-08-10T22:10:00Z", sleepMinutes: 4 },
      { timestamp: "2026-08-10T22:20:00Z", sleepMinutes: 8 },
      { timestamp: "2026-08-11T22:10:00Z", sleepMinutes: 10 },
    ]);

    expect(result).toEqual([
      { date: "2026-08-10", sleepHours: 0.2 },
      { date: "2026-08-11", sleepHours: 0.2 },
    ]);
  });

  it("returns an empty array for no data", () => {
    expect(aggregateSleepByDay([])).toEqual([]);
  });
});

describe("aggregateStepsByDay", () => {
  it("sums step counts per day", () => {
    const result = aggregateStepsByDay([
      { timestamp: "2026-08-10T22:10:00Z", stepCount: 50 },
      { timestamp: "2026-08-10T22:20:00Z", stepCount: 75 },
      { timestamp: "2026-08-11T22:10:00Z", stepCount: 100 },
    ]);

    expect(result).toEqual([
      { date: "2026-08-10", steps: 125 },
      { date: "2026-08-11", steps: 100 },
    ]);
  });
});

describe("fetchSleepData", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { email: "alice@email.net" },
          data: [{ timestamp: "2026-08-10T22:10:00Z", sleepMinutes: 10 }],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests sleep data with email and optional time range", async () => {
    await fetchSleepData({
      email: "alice@email.net",
      startTime: "2026-08-11T00:00:00Z",
      endTime: "2026-08-10T22:00:00Z",
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/sleep_data");
    expect(String(url)).toContain("email=alice%40email.net");
    expect(String(url)).toContain("startTime=2026-08-11T00%3A00%3A00Z");
    expect(String(url)).toContain("endTime=2026-08-10T22%3A00%3A00Z");
    expect(options).toMatchObject({ next: { revalidate: 300 } });
  });

  it("throws when the API responds with an error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchSleepData({ email: "alice@email.net" })).rejects.toThrow(
      "Failed to fetch sleep data: 500",
    );
  });
});

describe("fetchStepData", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { email: "bob@email.net" },
          data: [{ timestamp: "2026-08-10T22:10:00Z", stepCount: 42 }],
        }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests step data for the given email", async () => {
    const result = await fetchStepData({ email: "bob@email.net" });

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/step_data");
    expect(String(url)).toContain("email=bob%40email.net");
    expect(result.user.email).toBe("bob@email.net");
    expect(result.data).toHaveLength(1);
  });
});
