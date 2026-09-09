"use client";

import { useEffect, useRef, useState } from "react";
import {
  type LogActivityKey,
  LOG_ACTIVITY_CONFIG,
} from "@/app/(app)/_components/log/log-activity-config";
import { LogEntryForm } from "@/app/(app)/_components/log/log-entry-form";
import { useWellnessData } from "@/lib/swr/hooks";
import {
  CaloriesIcon,
  CustomIcon,
  SleepIcon,
  StepsIcon,
  WaterIcon,
} from "./create-fab-icons";
import styles from "../dashboard/_components/dashboard.module.css";

const CREATE_OPTIONS = [
  {
    id: "water" as const,
    label: "Water",
    tooltip: "Log glasses of water",
    Icon: WaterIcon,
    accent: "physical",
  },
  {
    id: "calories" as const,
    label: "Calories",
    tooltip: "Log calories consumed",
    Icon: CaloriesIcon,
    accent: "accent",
  },
  {
    id: "sleep" as const,
    label: "Sleep",
    tooltip: "Log hours of sleep",
    Icon: SleepIcon,
    accent: "sleep",
  },
  {
    id: "steps" as const,
    label: "Steps",
    tooltip: "Log daily step count",
    Icon: StepsIcon,
    accent: "physical",
  },
  {
    id: "custom" as const,
    label: "Custom",
    tooltip: "Track any wellness activity",
    Icon: CustomIcon,
    accent: "mental",
  },
] as const;

export function CreateFab() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalActivity, setModalActivity] = useState<LogActivityKey | null>(null);
  const { data: wellnessData, isLoading: loadingTypes } = useWellnessData();
  const activityTypes = wellnessData?.activityTypes ?? [];

  useEffect(() => {
    if (!menuOpen) return;

    let listener: ((event: PointerEvent) => void) | null = null;
    const timeoutId = window.setTimeout(() => {
      listener = (event: PointerEvent) => {
        if (!rootRef.current?.contains(event.target as Node)) {
          setMenuOpen(false);
        }
      };
      document.addEventListener("pointerdown", listener);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (listener) {
        document.removeEventListener("pointerdown", listener);
      }
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen && !modalActivity) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setModalActivity(null);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, modalActivity]);

  function openModal(type: LogActivityKey) {
    setMenuOpen(false);
    setModalActivity(type);
  }

  function closeModal() {
    setModalActivity(null);
  }

  return (
    <>
      <div ref={rootRef} className={styles.createFab} data-tour="create">
        {menuOpen ? (
          <div className={styles.createFabMenu} role="menu" aria-label="Create wellness entry">
            {CREATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitem"
                className={styles.createFabOption}
                data-accent={option.accent}
                aria-label={option.tooltip}
                onClick={() => openModal(option.id)}
              >
                <option.Icon className={styles.createFabOptionIcon} />
                <span className={styles.createFabTooltip} role="tooltip">
                  <span className={styles.createFabTooltipLabel}>{option.label}</span>
                  <span className={styles.createFabTooltipHint}>{option.tooltip}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          className={styles.createFabButton}
          aria-label={menuOpen ? "Close create menu" : "Add wellness entry"}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className={styles.createFabIcon} data-open={menuOpen ? "true" : "false"}>
            +
          </span>
          <span className={styles.createFabMainTooltip} role="tooltip">
            Add wellness entry
          </span>
        </button>
      </div>

      {modalActivity ? (
        <div
          className={styles.createModalBackdrop}
          role="presentation"
          onClick={closeModal}
        >
          <div
            className={`${styles.glassCard} ${styles.formCard} ${styles.createModal}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-entry-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.createModalHeader}>
              <div>
                <p className={styles.pageEyebrow}>Track</p>
                <h2 id="create-entry-title" className={styles.createModalTitle}>
                  Log {LOG_ACTIVITY_CONFIG[modalActivity].label.toLowerCase()}
                </h2>
              </div>
              <button
                type="button"
                className={styles.createModalClose}
                aria-label="Close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            {loadingTypes && activityTypes.length === 0 ? (
              <p className={styles.createModalLoading}>Loading...</p>
            ) : (
              <LogEntryForm
                activityTypes={activityTypes}
                initialActivity={modalActivity}
                hideActivitySelect={modalActivity !== "custom"}
                variant="modal"
                onSaved={closeModal}
                onCancel={closeModal}
              />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
