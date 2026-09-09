"use client";

import { useMemo, useState } from "react";
import { getMetricRegion } from "@/lib/wellness/body-regions";
import type { BodyRegion, DashboardData, WellnessAccent } from "@/types/wellness";
import { BodyMap } from "./body-map";
import { SleepChart } from "./sleep-chart";
import { WellnessChart } from "./wellness-chart";
import { buildWellnessScores, type WellnessScore } from "./wellness-scores";
import styles from "./dashboard.module.css";

const COLUMNS: {
  id: string;
  accent: WellnessAccent;
  eyebrow: string;
  title: string;
}[] = [
  { id: "sleep-column", accent: "sleep", eyebrow: "Rest", title: "Sleep" },
  { id: "mental-column", accent: "mental", eyebrow: "Mind", title: "Mental" },
  { id: "physical-column", accent: "physical", eyebrow: "Body", title: "Physical" },
];

function MetricColumn({
  id,
  accent,
  eyebrow,
  title,
  metrics,
  activeMetricKey,
  activeRegion,
  onPickMetric,
}: {
  id: string;
  accent: WellnessAccent;
  eyebrow: string;
  title: string;
  metrics: DashboardData["sleep"];
  activeMetricKey: string | null;
  activeRegion: BodyRegion | null;
  onPickMetric: (metricKey: string, region: BodyRegion) => void;
}) {
  return (
    <section className={styles.metricColumn} data-accent={accent} aria-labelledby={id}>
      <div className={styles.columnHeader}>
        <p className={styles.columnEyebrow}>{eyebrow}</p>
        <h2 id={id} className={styles.columnTitle}>
          {title}
        </h2>
      </div>
      <div className={styles.columnMetrics}>
        {metrics.map((metric) => {
          const metricKey = `${accent}:${metric.label}`;
          const region = getMetricRegion(metric.label, accent);
          const selected = activeMetricKey === metricKey;

          return (
            <button
              key={metric.label}
              type="button"
              className={styles.metricCard}
              data-tone={metric.tone ?? "steady"}
              data-selected={selected ? "true" : "false"}
              data-region-match={activeRegion === region && !selected ? "true" : "false"}
              aria-pressed={selected}
              onClick={() => onPickMetric(metricKey, region)}
            >
              <p className={styles.metricLabel}>{metric.label}</p>
              <p className={styles.metricValue}>{metric.value}</p>
              <p className={styles.metricHint}>{metric.detail}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ScoresCard({ scores }: { scores: WellnessScore[] }) {
  return (
    <div className={`${styles.glassCard} ${styles.scoresSlot}`}>
      <section className={styles.scoresSection} aria-label="Wellness scores">
        <ul className={styles.scoresList}>
          {scores.map((score) => (
            <li key={score.id} className={styles.scoreItem} data-accent={score.accent}>
              <p className={styles.scoreItemLabel}>{score.label}</p>
              <p className={styles.scoreItemValue}>{score.value}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function WellnessPanel({ data }: { data: DashboardData }) {
  const [activeMetricKey, setActiveMetricKey] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<BodyRegion | null>(null);
  const scores = useMemo(() => buildWellnessScores(data), [data]);

  const clear = () => {
    setActiveMetricKey(null);
    setActiveRegion(null);
  };

  const pickMetric = (metricKey: string, region: BodyRegion) => {
    if (activeMetricKey === metricKey) return clear();
    setActiveMetricKey(metricKey);
    setActiveRegion(region);
  };

  const pickRegion = (region: BodyRegion | null) => {
    if (!region || (activeRegion === region && !activeMetricKey)) return clear();
    setActiveMetricKey(null);
    setActiveRegion(region);
  };

  const sleep = COLUMNS[0];
  const mental = COLUMNS[1];
  const physical = COLUMNS[2];

  return (
    <section className={styles.wellnessPanel} aria-label="Wellness overview">
      <div className={styles.hubCanvas}>
        <div className={styles.clusterLeft}>
          <div className={`${styles.glassCard} ${styles.sleepSlot}`} data-tour="sleep">
            <MetricColumn
              {...sleep}
              metrics={data.sleep}
              activeMetricKey={activeMetricKey}
              activeRegion={activeRegion}
              onPickMetric={pickMetric}
            />
            <SleepChart timeline={data.sleepTimeline} />
          </div>
        </div>

        <div className={styles.clusterCenter}>
          <ScoresCard scores={scores} />
          <div className={`${styles.glassCard} ${styles.bodySlot}`} data-tour="body-map">
            <BodyMap activeRegion={activeRegion} onRegionSelect={pickRegion} />
          </div>
          <div className={`${styles.glassCard} ${styles.chartSlot}`} data-tour="insights">
            <WellnessChart
              overview={data.chartOverview}
              metricChart={activeMetricKey ? data.chartByMetric[activeMetricKey] ?? null : null}
            />
          </div>
        </div>

        <div className={styles.clusterRight} data-tour="mental-physical">
          <div className={`${styles.glassCard} ${styles.mentalSlot}`}>
            <MetricColumn
              {...mental}
              metrics={data.mental}
              activeMetricKey={activeMetricKey}
              activeRegion={activeRegion}
              onPickMetric={pickMetric}
            />
          </div>
          <div className={`${styles.glassCard} ${styles.physicalSlot}`}>
            <MetricColumn
              {...physical}
              metrics={data.physical}
              activeMetricKey={activeMetricKey}
              activeRegion={activeRegion}
              onPickMetric={pickMetric}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
