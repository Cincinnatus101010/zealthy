"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CreateFab } from "./create-fab";
import { HistoryDrawer } from "./history-drawer";
import { HistoryDrawerProvider, useHistoryDrawer } from "./history-drawer-context";
import styles from "../dashboard/_components/dashboard.module.css";

const NAV_ITEMS = [{ href: "/dashboard", label: "Dashboard" }] as const;

type AppShellProps = {
  profile: ReactNode;
  children: ReactNode;
  onStartTour?: () => void;
};

function AppShellInner({ profile, children, onStartTour }: AppShellProps) {
  const pathname = usePathname();
  const { open: historyOpen, toggleDrawer } = useHistoryDrawer();

  return (
    <div className={styles.dashboardShell}>
      <header className={styles.topNav}>
        <div className={styles.topNavInner}>
          <nav className={styles.appNav} aria-label="App sections">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.appNavItem}
                data-active={pathname === item.href ? "true" : "false"}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              className={styles.appNavItem}
              data-active={historyOpen ? "true" : "false"}
              aria-expanded={historyOpen}
              data-tour="history"
              onClick={toggleDrawer}
            >
              History
            </button>
            {onStartTour ? (
              <button type="button" className={styles.appNavItem} onClick={onStartTour}>
                Tour
              </button>
            ) : null}
          </nav>
          {profile}
        </div>
      </header>

      <div className={styles.pageContent}>{children}</div>
      <CreateFab />
      <HistoryDrawer />
    </div>
  );
}

export function AppShell(props: AppShellProps) {
  return (
    <HistoryDrawerProvider>
      <AppShellInner {...props} />
    </HistoryDrawerProvider>
  );
}
