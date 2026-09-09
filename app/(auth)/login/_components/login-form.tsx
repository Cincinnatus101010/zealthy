"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import styles from "../../auth.module.css";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const next = searchParams.get("next") ?? "/dashboard";
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: next,
      });

      if (result.error) {
        setError(result.error.message ?? "Login failed.");
        return;
      }

      router.push(next);
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
              <p className={styles.authEyebrow}>Welcome back</p>
              <h1 className={styles.authTitle}>Log in</h1>
              <p className={styles.authSubtitle}>
                Sign in with any pre-seeded test account or an account you created. Sleep and
                steps are imported from the Zealthy API when available for your email.
              </p>
            </div>

            {error ? <p className={styles.authError}>{error}</p> : null}

            <form onSubmit={handleSubmit} className={styles.authStack}>
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
                  autoComplete="current-password"
                  className={styles.authInput}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className={styles.authButton} disabled={loading}>
                {loading ? "Logging in..." : "Log in"}
              </button>
            </form>

            <p className={styles.authHint}>
              Demo account: <code>alice@email.net</code> / <code>password</code> (pre-seeded sample
              data)
              <br />
              Also try <code>bob@email.net</code> or <code>ming@email.net</code> /{" "}
              <code>password</code> for Zealthy sleep and step data.
            </p>
            <p className={styles.authFooter}>
              Need an account? <Link href="/signup" className={styles.authLink}>Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
