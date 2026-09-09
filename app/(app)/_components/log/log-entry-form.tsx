"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useHistoryDrawer } from "@/app/(app)/_components/history-drawer-context";
import { revalidateWellness } from "@/lib/swr/revalidate-wellness";
import styles from "@/app/(app)/dashboard/_components/dashboard.module.css";
import {
  LOG_ACTIVITY_CONFIG,
  LOG_ACTIVITY_KEYS,
  type LogActivityKey,
} from "./log-activity-config";

type ActivityType = {
  id: string;
  name: string;
  unit: string | null;
};

type LogEntryFormProps = {
  activityTypes: ActivityType[];
  initialActivity?: LogActivityKey;
  hideActivitySelect?: boolean;
  variant?: "page" | "modal";
  onSaved?: () => void;
  onCancel?: () => void;
};

export function LogEntryForm({
  activityTypes,
  initialActivity = "water",
  hideActivitySelect = false,
  variant = "page",
  onSaved,
  onCancel,
}: LogEntryFormProps) {
  const { openDrawer } = useHistoryDrawer();
  const today = new Date().toISOString().slice(0, 10);

  const [activity, setActivity] = useState<LogActivityKey>(initialActivity);

  useEffect(() => {
    setActivity(initialActivity);
  }, [initialActivity]);

  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const preset = useMemo(
    () => LOG_ACTIVITY_CONFIG[activity] ?? LOG_ACTIVITY_CONFIG.water,
    [activity],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const label = activity === "custom" ? customName.trim() : preset.label;
    const unit =
      activity === "custom" ? customUnit.trim() || undefined : preset.unit || undefined;

    try {
      const response = await fetch("/api/wellness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: preset.apiType,
          label,
          value: Number(value),
          unit,
          date,
          notes: notes.trim() || undefined,
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to save entry.");
        return;
      }

      setSuccess("Entry saved.");
      setValue("");
      setNotes("");
      if (activity === "custom") {
        setCustomName("");
        setCustomUnit("");
      }
      await revalidateWellness();
      onSaved?.();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={variant === "page" ? `${styles.glassCard} ${styles.formCard}` : undefined}>
      {error ? <p className={styles.formError}>{error}</p> : null}
      {success ? <p className={styles.formSuccess}>{success}</p> : null}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          {hideActivitySelect ? null : (
            <div>
              <label className={styles.formLabel} htmlFor="activity">
                Activity
              </label>
              <select
                id="activity"
                className={styles.glassSelect}
                value={activity}
                onChange={(event) => setActivity(event.target.value as LogActivityKey)}
              >
                {LOG_ACTIVITY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {LOG_ACTIVITY_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={styles.formLabel} htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              className={styles.glassInput}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </div>

          {activity === "custom" ? (
            <>
              <div>
                <label className={styles.formLabel} htmlFor="custom-name">
                  Activity name
                </label>
                <input
                  id="custom-name"
                  className={styles.glassInput}
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="Meditation, Mood, Stretching..."
                  list="custom-activities"
                  required
                />
                <datalist id="custom-activities">
                  {activityTypes.map((item) => (
                    <option key={item.id} value={item.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className={styles.formLabel} htmlFor="custom-unit">
                  Unit (optional)
                </label>
                <input
                  id="custom-unit"
                  className={styles.glassInput}
                  value={customUnit}
                  onChange={(event) => setCustomUnit(event.target.value)}
                  placeholder="minutes, score, reps..."
                />
              </div>
            </>
          ) : null}

          <div>
            <label className={styles.formLabel} htmlFor="value">
              Value
            </label>
            <input
              id="value"
              type="number"
              step="any"
              className={styles.glassInput}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={preset.valuePlaceholder}
              required
            />
          </div>

          <div className={styles.formGridWide}>
            <label className={styles.formLabel} htmlFor="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              className={styles.glassTextarea}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth remembering about today"
            />
          </div>
        </div>

        <div className={styles.formActions}>
          {variant === "page" ? (
            <button type="button" className={styles.historyButton} onClick={openDrawer}>
              View history
            </button>
          ) : (
            <button type="button" className={styles.historyButton} onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className={styles.historyButton} disabled={loading}>
            {loading ? "Saving..." : "Save entry"}
          </button>
        </div>
      </form>
    </div>
  );
}
