"use client";

import { useMemo, useState } from "react";
import { useWellnessData } from "@/lib/swr/hooks";
import type { WellnessApiResponse } from "@/lib/swr/types";
import { revalidateWellness } from "@/lib/swr/revalidate-wellness";
import styles from "../../dashboard/_components/dashboard.module.css";

export type HistoryEntry = {
  id: string;
  type: string;
  label: string;
  value: number;
  unit: string | null;
  date: string;
  notes: string | null;
};

type HistoryTableProps = {
  fallbackData?: WellnessApiResponse;
  variant?: "page" | "drawer";
};

function formatDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatValue(entry: HistoryEntry) {
  return entry.unit ? `${entry.value} ${entry.unit}` : String(entry.value);
}

function normalizeEntry(entry: WellnessApiResponse["entries"][number]): HistoryEntry {
  return {
    ...entry,
    date: typeof entry.date === "string" ? entry.date : new Date(entry.date).toISOString(),
  };
}

export function HistoryTable({ fallbackData, variant = "page" }: HistoryTableProps) {
  const { data, isLoading } = useWellnessData(fallbackData);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const entries = useMemo(
    () => (data?.entries ?? []).map(normalizeEntry),
    [data?.entries],
  );

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);

    try {
      const response = await fetch(`/api/wellness/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to delete entry.");
        return;
      }

      await revalidateWellness();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const table = (
    <>
      {error ? <p className={styles.formError}>{error}</p> : null}

      {isLoading && entries.length === 0 ? (
        <p className={styles.historyEmpty}>Loading entries...</p>
      ) : entries.length === 0 ? (
        <p className={styles.historyEmpty}>No entries yet. Log your first activity to see it here.</p>
      ) : (
        <div className={styles.historyTableWrap}>
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th>Value</th>
                <th>Notes</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                  <td>{entry.label}</td>
                  <td>{formatValue(entry)}</td>
                  <td>{entry.notes ?? "—"}</td>
                  <td>
                    <div className={styles.historyActions}>
                      <button
                        type="button"
                        className={`${styles.historyButton} ${styles.historyButtonDanger}`}
                        disabled={deletingId === entry.id}
                        onClick={() => handleDelete(entry.id)}
                      >
                        {deletingId === entry.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );

  if (variant === "drawer") {
    return table;
  }

  return <div className={`${styles.glassCard} ${styles.historyCard}`}>{table}</div>;
}
