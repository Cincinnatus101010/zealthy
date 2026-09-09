"use client";

import { useId } from "react";
import { BODY_REGION_LIST, BODY_REGIONS, BODY_SILHOUETTE } from "@/lib/wellness/body-regions";
import type { BodyRegion } from "@/types/wellness";
import styles from "./dashboard.module.css";

type BodyMapProps = {
  activeRegion: BodyRegion | null;
  onRegionSelect: (region: BodyRegion | null) => void;
};

export function BodyMap({ activeRegion, onRegionSelect }: BodyMapProps) {
  const clipId = useId();
  const toggle = (region: BodyRegion) =>
    onRegionSelect(activeRegion === region ? null : region);

  return (
    <figure className={styles.bodyMap} aria-label="Body wellness map">
      <svg
        viewBox={BODY_SILHOUETTE.viewBox}
        className={styles.bodySvg}
        role="img"
        aria-label="Body wellness map"
      >
        <defs>
          <clipPath id={clipId}>
            <path d={BODY_SILHOUETTE.path} />
          </clipPath>
        </defs>
        <path
          d={BODY_SILHOUETTE.path}
          className={styles.bodySilhouette}
          data-dimmed={activeRegion ? "true" : "false"}
          pointerEvents="none"
        />
        <g clipPath={`url(#${clipId})`} className={styles.bodyZones}>
          {BODY_REGION_LIST.map((region) => (
            <path
              key={region}
              d={BODY_REGIONS[region].path}
              className={styles.bodyZone}
              data-region={region}
              data-active={activeRegion === region ? "true" : "false"}
              role="button"
              tabIndex={0}
              aria-label={BODY_REGIONS[region].label}
              aria-pressed={activeRegion === region}
              onClick={() => toggle(region)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggle(region);
                }
              }}
            />
          ))}
        </g>
      </svg>
      <figcaption className={styles.bodyLegend}>
        {BODY_REGION_LIST.map((region) => (
          <button
            key={region}
            type="button"
            className={styles.legendItem}
            data-region={region}
            data-active={activeRegion === region ? "true" : "false"}
            aria-pressed={activeRegion === region}
            onClick={() => toggle(region)}
          >
            {BODY_REGIONS[region].label}
          </button>
        ))}
      </figcaption>
    </figure>
  );
}
