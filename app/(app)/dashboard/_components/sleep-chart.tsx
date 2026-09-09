"use client";

import { useId, useMemo } from "react";
import {
  SLEEP_STAGE_COLORS,
  SLEEP_STAGE_LABELS,
} from "@/lib/wellness/sleep-timeline";
import type { SleepStage, SleepTimeline } from "@/types/wellness";
import styles from "./dashboard.module.css";

const STAGE_ROWS: SleepStage[] = ["awake", "rem", "core", "deep"];

type SleepChartProps = {
  timeline: SleepTimeline | null;
};

function rowIndex(stage: SleepStage) {
  return STAGE_ROWS.indexOf(stage);
}

export function SleepChart({ timeline }: SleepChartProps) {
  const glowId = useId();

  const layout = useMemo(() => {
    if (!timeline || timeline.segments.length === 0) return null;

    const startMs = new Date(timeline.segments[0].start).getTime();
    const endMs = new Date(timeline.segments.at(-1)!.end).getTime();
    const spanMs = Math.max(endMs - startMs, 1);

    const bars = timeline.segments.map((segment) => {
      const segmentStart = new Date(segment.start).getTime();
      const segmentEnd = new Date(segment.end).getTime();
      const x = ((segmentStart - startMs) / spanMs) * 100;
      const width = Math.max(((segmentEnd - segmentStart) / spanMs) * 100, 0.8);
      const row = rowIndex(segment.stage);

      return {
        key: `${segment.stage}-${segment.start}`,
        stage: segment.stage,
        x,
        width,
        y: 6 + row * 14,
        height: 10,
      };
    });

    return { bars, startMs, endMs };
  }, [timeline]);

  if (!timeline || !layout) {
    return (
      <section className={styles.sleepChart} aria-label="Sleep stages">
        <p className={styles.sleepChartEmpty}>No sleep stage data for last night.</p>
      </section>
    );
  }

  const asleepStages = STAGE_ROWS.filter((stage) => timeline.stageTotals[stage] > 0);

  return (
    <section className={styles.sleepChart} aria-label="Sleep stages">
      <div className={styles.sleepChartHeader}>
        <div>
          <p className={styles.sleepChartEyebrow}>Last night</p>
          <p className={styles.sleepChartTotal}>{timeline.totalLabel}</p>
        </div>
        <p className={styles.sleepChartRange}>
          {timeline.startLabel} – {timeline.endLabel}
        </p>
      </div>

      <div className={styles.sleepHypnogram}>
        <svg
          viewBox="0 0 100 64"
          className={styles.sleepHypnogramSvg}
          role="img"
          aria-label={`Sleep timeline, ${timeline.totalLabel} asleep`}
        >
          <defs>
            <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="100" height="64" rx="8" fill={`url(#${glowId})`} />

          {STAGE_ROWS.map((stage, index) => (
            <rect
              key={stage}
              x="0"
              y={4 + index * 14}
              width="100"
              height="12"
              rx="6"
              className={styles.sleepStageLane}
            />
          ))}

          {layout.bars.map((bar) => (
            <rect
              key={bar.key}
              x={bar.x}
              y={bar.y}
              width={bar.width}
              height={bar.height}
              rx="5"
              fill={SLEEP_STAGE_COLORS[bar.stage]}
              className={styles.sleepStageBlock}
              data-stage={bar.stage}
            />
          ))}
        </svg>
      </div>

      <ul className={styles.sleepStageLegend}>
        {asleepStages.map((stage) => (
          <li key={stage} className={styles.sleepStageLegendItem}>
            <span
              className={styles.sleepStageSwatch}
              style={{ background: SLEEP_STAGE_COLORS[stage] }}
              aria-hidden="true"
            />
            <span className={styles.sleepStageLegendLabel}>{SLEEP_STAGE_LABELS[stage]}</span>
            <span className={styles.sleepStageLegendValue}>
              {formatStageDuration(timeline.stageTotals[stage])}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatStageDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
