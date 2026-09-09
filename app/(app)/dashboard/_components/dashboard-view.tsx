"use client";

import { useDashboardData } from "@/lib/swr/hooks";
import type { DashboardData } from "@/types/wellness";
import styles from "./dashboard.module.css";
import { AppShell } from "../../_components/app-shell";
import { DashboardTour, useDashboardTour } from "./dashboard-tour";
import { ProfileMenu } from "./profile-menu";
import { WellnessPanel } from "./wellness-panel";

type DashboardViewProps = {
  name: string;
  email: string;
  initialData: DashboardData;
};

export function DashboardView({ name, email, initialData }: DashboardViewProps) {
  const { data = initialData } = useDashboardData(initialData);
  const { run, setRun, startTour } = useDashboardTour();
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <main className={styles.dashboard}>
      <DashboardTour run={run} onRunChange={setRun} />
      <AppShell
        onStartTour={startTour}
        profile={<ProfileMenu name={name} email={email} variant="nav" />}
      >
        <div className={styles.welcomeBlock} data-tour="welcome">
          <p className={styles.welcomeEyebrow}>Welcome, {firstName}</p>
          <h1 className={styles.welcomeTitle}>Your Wellness Hub</h1>
        </div>
        <WellnessPanel data={data} />
      </AppShell>
    </main>
  );
}
