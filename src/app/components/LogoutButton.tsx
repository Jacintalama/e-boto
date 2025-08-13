"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ asLink = false }: { asLink?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick(e?: React.MouseEvent) {
    e?.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/logout", { method: "POST", credentials: "include" })
      // even if backend fails, force client-side clear by navigating away
      if (!r.ok) console.warn("Logout non-200:", await r.text().catch(() => ""));
    } catch (err) {
      console.warn("Logout error:", (err as Error)?.message);
    } finally {
      setLoading(false);
      router.replace("/login");
    }
  }

  if (asLink) {
    return (
      <a
        href="/login"
        onClick={onClick}
        style={{ cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}
        aria-disabled={loading}
      >
        {loading ? "Logging out…" : "Logout"}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #db1540ff",
        background: "red",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
      aria-busy={loading}
    >
      {loading ? "Logging out…" : "Logout"}
    </button>
  );
}
