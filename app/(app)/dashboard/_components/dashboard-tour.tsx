"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ACTIONS, EVENTS, Joyride, type Step } from "react-joyride";

const STORAGE_KEY = "zeathy-dashboard-tour-seen";

export const DASHBOARD_TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="welcome"]',
    title: "Your Wellness Hub",
    content:
      "This hub brings sleep, mental, and physical metrics together in one glass dashboard powered by Zealthy data and your own entries.",
    placement: "bottom",
  },
  {
    target: '[data-tour="sleep"]',
    title: "Sleep insights",
    content:
      "Review last night's duration, efficiency, and stages. Tap a metric card to highlight the matching body region and trend chart.",
    placement: "right",
  },
  {
    target: '[data-tour="body-map"]',
    title: "Interactive body map",
    content:
      "Click regions on the silhouette to explore related metrics, or select a metric card to see where it maps on the body.",
    placement: "bottom",
  },
  {
    target: '[data-tour="insights"]',
    title: "Scores and trends",
    content:
      "Wellness scores summarize your day. When you pick a metric, the chart below shows its recent trend.",
    placement: "top",
  },
  {
    target: '[data-tour="mental-physical"]',
    title: "Mental and physical",
    content:
      "Mood, stress, steps, calories, and hydration live here. Each card connects to the body map and chart for deeper context.",
    placement: "left",
  },
  {
    target: '[data-tour="history"]',
    title: "Entry history",
    content:
      "Open History to browse, filter, and review everything you have logged without leaving the dashboard.",
    placement: "bottom",
  },
  {
    target: '[data-tour="create"]',
    title: "Log new entries",
    content:
      "Use the + button to log water, calories, sleep, steps, or custom activities. Saved entries refresh the dashboard instantly.",
    placement: "left",
  },
  {
    target: '[data-tour="profile"]',
    title: "Your account",
    content: "Manage your profile and sign out from here. Replay this tour anytime with the Tour button in the nav.",
    placement: "bottom-end",
  },
];

const tourStyles = {
  tooltip: {
    borderRadius: 16,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
  },
  tooltipTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    marginBottom: "0.35rem",
  },
  tooltipContent: {
    fontSize: "0.92rem",
    lineHeight: 1.55,
    color: "rgba(248, 250, 252, 0.82)",
  },
  buttonPrimary: {
    borderRadius: 999,
    fontWeight: 600,
  },
  buttonBack: {
    color: "rgba(248, 250, 252, 0.72)",
  },
  buttonSkip: {
    color: "rgba(248, 250, 252, 0.55)",
  },
};

type DashboardTourProps = {
  run: boolean;
  onRunChange: (run: boolean) => void;
};

export function DashboardTour({ run, onRunChange }: DashboardTourProps) {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  const finishTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    onRunChange(false);
  }, [onRunChange]);

  return (
    <Joyride
      run={run && onDashboard}
      steps={DASHBOARD_TOUR_STEPS}
      continuous
      scrollToFirstStep
      locale={{ last: "Done" }}
      styles={tourStyles}
      options={{
        arrowColor: "rgba(18, 22, 30, 0.96)",
        backgroundColor: "rgba(18, 22, 30, 0.96)",
        primaryColor: "#ff7a21",
        textColor: "#f8fafc",
        overlayColor: "rgba(6, 8, 12, 0.72)",
        spotlightPadding: 12,
        spotlightRadius: 16,
        zIndex: 10000,
        showProgress: true,
        skipBeacon: true,
        buttons: ["back", "skip", "primary"],
        overlayClickAction: "next",
      }}
      onEvent={(data) => {
        if (
          data.type === EVENTS.TOUR_END ||
          data.action === ACTIONS.SKIP ||
          (data.action === ACTIONS.CLOSE && data.status === "finished")
        ) {
          finishTour();
        }
      }}
    />
  );
}

export function useDashboardTourAutoStart(onRunChange: (run: boolean) => void) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timeoutId = window.setTimeout(() => onRunChange(true), 900);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, onRunChange]);
}

export function useDashboardTour() {
  const [run, setRun] = useState(false);
  useDashboardTourAutoStart(setRun);

  const startTour = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRun(true);
  }, []);

  return { run, setRun, startTour };
}
