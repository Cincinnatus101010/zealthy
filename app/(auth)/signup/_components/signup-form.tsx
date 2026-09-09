"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "../../auth.module.css";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email.split("@")[0] || "User",
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setError(result.error.message ?? "Signup failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.dashboard}>
      <div className={styles.authShell}>
        <div className={styles.authCard}>
          <div className={styles.authStack}>
            <div>
              <p className={styles.authEyebrow}>Get started</p>
              <h1 className={styles.authTitle}>Create account</h1>
              <p className={styles.authSubtitle}>
                Create a new account with any email. Sleep and steps import automatically from
                the Zealthy API when data exists for your address.
              </p>
            </div>

            {error ? <p className={styles.authError}>{error}</p> : null}

            <form onSubmit={handleSubmit} className={styles.authStack}>
              <div className={styles.authField}>
                <label className={styles.authLabel} htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={styles.authInput}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div className={styles.authField}>
                <label className={styles.authLabel} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={styles.authInput}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@email.net"
                  required
                />
              </div>
              <div className={styles.authField}>
                <label className={styles.authLabel} htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={styles.authInput}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                />
              </div>
              <button type="submit" className={styles.authButton} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className={styles.authFooter}>
              Already have an account? <Link href="/login" className={styles.authLink}>Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
