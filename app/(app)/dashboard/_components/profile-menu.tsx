"use client";

import { Avatar, Menu, MenuItem } from "@troisi/ui";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./dashboard.module.css";

type ProfileMenuProps = {
  name: string;
  email: string;
  variant?: "nav" | "compact";
};

export function ProfileMenu({ name, email, variant = "compact" }: ProfileMenuProps) {
  const router = useRouter();
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const handle = `@${email.split("@")[0] ?? "user"}`;

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Menu
      className={styles.profileMenu}
      trigger={
        <button
          type="button"
          className={styles.profileTrigger}
          data-variant={variant}
          data-tour="profile"
          aria-label={`${name} account menu`}
        >
          <Avatar initials={initial} size="sm" />
          {variant === "nav" ? (
            <>
              <span className={styles.profileTriggerText}>
                <span className={styles.profileTriggerName}>{name}</span>
                <span className={styles.profileTriggerHandle}>{handle}</span>
              </span>
              <svg className={styles.profileChevron} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </>
          ) : null}
        </button>
      }
    >
      <div className={styles.profilePanelHeader}>
        <Avatar initials={initial} size="md" />
        <div>
          <p className={styles.profilePanelName}>{name}</p>
          <p className={styles.profilePanelEmail}>{email}</p>
        </div>
      </div>
      <MenuItem className={styles.profileSignOut} onClick={handleLogout}>
        Sign out
      </MenuItem>
    </Menu>
  );
}
