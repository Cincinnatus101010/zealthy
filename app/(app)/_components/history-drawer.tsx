"use client";

import { useEffect } from "react";
import { HistoryTable } from "@/app/(app)/history/_components/history-table";
import { useHistoryDrawer } from "./history-drawer-context";
import styles from "../dashboard/_components/dashboard.module.css";

export function HistoryDrawer() {
  const { open, closeDrawer } = useHistoryDrawer();

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, closeDrawer]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div
        className={styles.historyDrawerBackdrop}
        data-open={open ? "true" : "false"}
        role="presentation"
        onClick={closeDrawer}
      />

      <aside
        className={styles.historyDrawer}
        data-open={open ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-drawer-title"
        aria-hidden={!open}
      >
        <div className={styles.historyDrawerHeader}>
          <div>
            <p className={styles.pageEyebrow}>Review</p>
            <h2 id="history-drawer-title" className={styles.historyDrawerTitle}>
              History
            </h2>
            <p className={styles.historyDrawerSubtitle}>
              Your logged wellness entries across water, calories, sleep, and steps.
            </p>
          </div>
          <button
            type="button"
            className={styles.createModalClose}
            aria-label="Close history"
            onClick={closeDrawer}
          >
            ×
          </button>
        </div>

        <div className={styles.historyDrawerBody}>
          <HistoryTable variant="drawer" />
        </div>
      </aside>
    </>
  );
}
