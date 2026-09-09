"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type HistoryDrawerContextValue = {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
};

const HistoryDrawerContext = createContext<HistoryDrawerContextValue | null>(null);

export function HistoryDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo(
    () => ({
      open,
      openDrawer: () => setOpen(true),
      closeDrawer: () => setOpen(false),
      toggleDrawer: () => setOpen((current) => !current),
    }),
    [open],
  );

  return (
    <HistoryDrawerContext.Provider value={value}>{children}</HistoryDrawerContext.Provider>
  );
}

export function useHistoryDrawer() {
  const context = useContext(HistoryDrawerContext);
  if (!context) {
    throw new Error("useHistoryDrawer must be used within HistoryDrawerProvider.");
  }
  return context;
}
