import { describe, expect, it } from "vitest";
import { displayName, normalizeEmail } from "@/lib/auth/users";

describe("auth users", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Alice@Email.net ")).toBe("alice@email.net");
  });

  it("derives a display name from email when name is missing", () => {
    expect(displayName("bob@email.net", null)).toBe("bob");
  });

  it("prefers the stored name when present", () => {
    expect(displayName("alice@email.net", "Alice")).toBe("Alice");
  });
});
