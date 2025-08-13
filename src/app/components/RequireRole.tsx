// src/app/components/RequireRole.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  role: "admin" | "student";
  children: React.ReactNode;
  redirectTo?: string; // default "/login"
};

export default function RequireRole({ role, children, redirectTo = "/login" }: Props) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!r.ok) throw new Error("Unauthenticated");
        const j = await r.json();
        const got = String(j?.user?.role || j?.role || "").toLowerCase();
        if (got !== role) {
          const next = encodeURIComponent(location.pathname + location.search);
          router.replace(`${redirectTo}?next=${next}`);
          return;
        }
        setOk(true);
      } catch {
        const next = encodeURIComponent(location.pathname + location.search);
        router.replace(`${redirectTo}?next=${next}`);
      }
    })();
    return () => controller.abort();
  }, [role, redirectTo, router]);

  if (!ok) return <div style={{ padding: 16 }}>Checking access…</div>;
  return <>{children}</>;
}
