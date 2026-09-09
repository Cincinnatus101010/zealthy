"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartOverviewPoint, MetricChart } from "@/types/wellness";
import styles from "./dashboard.module.css";

type WellnessChartProps = {
  overview: ChartOverviewPoint[];
  metricChart: MetricChart | null;
};

export function WellnessChart({ overview, metricChart }: WellnessChartProps) {
  const title = metricChart?.title ?? "7-day overview";
  const subtitle = metricChart?.subtitle ?? "Mood and hydration";
  const hasOverview = overview.some((point) => point.mood !== null || point.water !== null);
  const hasMetric = metricChart?.points.some((point) => point.value !== null) ?? false;
  const showChart = metricChart ? hasMetric : hasOverview;

  return (
    <section className={styles.chartColumn} aria-labelledby="trends-column">
      <div className={styles.columnHeader}>
        <p className={styles.columnEyebrow}>Trends</p>
        <h2 id="trends-column" className={styles.columnTitle}>
          {title}
        </h2>
        <p className={styles.chartSubtitle}>{subtitle}</p>
      </div>

      <div className={styles.chartWrap}>
        {showChart ? (
          <ResponsiveContainer width="100%" height="100%">
            {metricChart ? (
              <AreaChart
                data={metricChart.points}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={metricChart.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={metricChart.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--wellness-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--wellness-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.65rem",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(18, 22, 31, 0.92)",
                    color: "#f5f7fb",
                    fontSize: "0.75rem",
                  }}
                  formatter={(value) =>
                    value === null || value === undefined
                      ? ["—", metricChart.title]
                      : [
                          metricChart.unit ? `${value} ${metricChart.unit}` : value,
                          metricChart.title,
                        ]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={metricChart.title}
                  stroke={metricChart.color}
                  fill="url(#metricFill)"
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              </AreaChart>
            ) : (
              <AreaChart data={overview} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.08)"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--wellness-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--wellness-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.65rem",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(18, 22, 31, 0.92)",
                    color: "#f5f7fb",
                    fontSize: "0.75rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  name="Mood"
                  stroke="#8b5cf6"
                  fill="url(#moodFill)"
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="water"
                  name="Water"
                  stroke="#0ea5e9"
                  fill="url(#waterFill)"
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <p className={styles.chartEmpty}>
            {metricChart
              ? `No ${metricChart.title.toLowerCase()} data for the last 7 days.`
              : "Select a metric or log mood and water to see trends."}
          </p>
        )}
      </div>
    </section>
  );
}
