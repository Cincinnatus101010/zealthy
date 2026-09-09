import { describe, expect, it } from "vitest";
import {
  isTestAccountEmail,
  TEST_ACCOUNT_EMAILS,
  TEST_ACCOUNT_PASSWORD,
} from "@/lib/auth/constants";

describe("test account constants", () => {
  it("lists all three Zealthy exercise emails", () => {
    expect(TEST_ACCOUNT_EMAILS).toEqual([
      "alice@email.net",
      "bob@email.net",
      "ming@email.net",
    ]);
  });

  it("recognizes Zealthy test account emails", () => {
    expect(isTestAccountEmail("alice@email.net")).toBe(true);
    expect(isTestAccountEmail("bob@email.net")).toBe(true);
    expect(isTestAccountEmail("ming@email.net")).toBe(true);
    expect(isTestAccountEmail("someone@example.com")).toBe(false);
  });

  it("uses a shared demo password for pre-seeded accounts", () => {
    expect(TEST_ACCOUNT_PASSWORD).toBe("password");
  });
});
