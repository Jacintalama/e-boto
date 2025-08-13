// app/login/page.tsx
"use client";
import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type LoginResponse = {
  role?: "admin" | "student" | string;
  user?: { id: string | number; username?: string; schoolId?: string; role?: string };
  error?: string;
};

const ROLE_TO_DEFAULT_PATH: Record<"admin" | "student", string> = {
  admin: "/dashboard",
  student: "/student-dashboard",
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = useMemo(() => params.get("next") || "", [params]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr(null);

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      clearTimeout(t);

      const j: LoginResponse = await r.json().catch(() => ({} as any));
      if (!r.ok) throw new Error(j?.error || "Login failed");

      // read role from /login or fallback to /me
      let role = (j.role || j.user?.role || "").toString().toLowerCase();
      if (role !== "admin" && role !== "student") {
        const meRes = await fetch("/api/me", { credentials: "include" });
        if (meRes.ok) {
          const me = await meRes.json();
          role = String(me?.user?.role || "").toLowerCase();
        }
      }
      if (role !== "admin" && role !== "student") throw new Error("Role missing");

      const fallback = ROLE_TO_DEFAULT_PATH[role as "admin" | "student"];
      router.replace(nextParam || fallback);
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      clearTimeout(t);
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380, padding: 20, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Login</h1>
        <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>Username / School ID</label>
        <input value={username} onChange={e=>setUsername(e.target.value)} required placeholder="SCHOOL-ID or admin username"
               autoComplete="username" style={{ width:"100%", padding:10, borderRadius:8, border:"1px solid #d1d5db", marginBottom:12 }}/>
        <label style={{ display: "block", fontSize: 14, marginBottom: 6 }}>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
               placeholder="••••••••" autoComplete="current-password"
               style={{ width:"100%", padding:10, borderRadius:8, border:"1px solid #d1d5db", marginBottom:16 }}/>
        {err && <p style={{ color: "crimson", marginBottom: 8 }}>{err}</p>}
        <button disabled={loading} style={{ width:"100%", padding:12, borderRadius:10, border:"none", background:"#111827", color:"#fff" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
