import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchZealthyMetrics } from "@/lib/wellness/zealthy-metrics";

describe("fetchZealthyMetrics", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { email: "alice@email.net" },
            data: [
              { timestamp: "2026-09-08T22:10:00Z", sleepMinutes: 0 },
              { timestamp: "2026-09-08T22:20:00Z", sleepMinutes: 10 },
              { timestamp: "2026-09-08T22:30:00Z", sleepMinutes: 10 },
              { timestamp: "2026-09-09T01:00:00Z", sleepMinutes: 10 },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            user: { email: "alice@email.net" },
            data: [
              { timestamp: "2026-09-08T20:10:00Z", stepCount: 1000 },
              { timestamp: "2026-09-08T20:20:00Z", stepCount: 2500 },
              { timestamp: "2026-09-09T20:10:00Z", stepCount: 500 },
            ],
          }),
        }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds sleep and step metrics from the public Zealthy API", async () => {
    const metrics = await fetchZealthyMetrics("alice@email.net");

    expect(metrics.sleep[0]).toMatchObject({ label: "Sleep", value: "0.2 hrs" });
    expect(metrics.steps).toMatchObject({ label: "Steps", value: "500" });
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });
});
