import { normalizeEmail } from "@/lib/auth/users";

export const DEMO_LOGIN = {
  email: "alice@email.net",
  password: "password",
} as const;

/** Shared password for all pre-seeded Zealthy test accounts. */
export const TEST_ACCOUNT_PASSWORD = DEMO_LOGIN.password;

/** Zealthy exercise test accounts — all three are pre-seeded for login. */
export const TEST_ACCOUNT_EMAILS = [
  DEMO_LOGIN.email,
  "bob@email.net",
  "ming@email.net",
] as const;

export type TestAccountEmail = (typeof TEST_ACCOUNT_EMAILS)[number];

export function isTestAccountEmail(email: string) {
  return TEST_ACCOUNT_EMAILS.includes(normalizeEmail(email) as TestAccountEmail);
}
