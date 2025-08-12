"use client";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const params = useSearchParams();
  const nextPath = useMemo(() => params.get("next") || "/dashboard", [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return; // prevent double submit
    setLoading(true);
    setErr(null);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      }).catch((e) => {
        // turn AbortError / network issues into a clear message
        throw new Error(e?.name === "AbortError" ? "Login request timed out" : e.message);
      });

      clearTimeout(t);
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Login failed");

      router.replace(nextPath); // go to intended page
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <form onSubmit={onSubmit} style={{
        width: "100%", maxWidth: 380, padding: 20, border: "1px solid #e5e7eb",
        borderRadius: 12
      }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Login</h1>

        <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          placeholder="admin"
          autoComplete="username"
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db", marginBottom: 12 }}
        />

        <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          autoComplete="current-password"
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #d1d5db", marginBottom: 16 }}
        />

        {err && <p style={{ color: "crimson", marginBottom: 8 }}>{err}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: 12, borderRadius: 10, border: "none",
            background: "#111827", color: "white", cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
