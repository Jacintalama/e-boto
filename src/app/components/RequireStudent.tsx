"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function RequireStudent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  const ran = useRef(false); // prevent double-run in StrictMode

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        if (!r.ok) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        const j = await r.json();
        const role = String(j?.user?.role ?? j?.role ?? "").toLowerCase();
        if (role !== "student") {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        setOk(true);
      } catch {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    })();

    return () => controller.abort();
  }, [router, pathname]);

  if (!ok) return <div className="p-6 text-sm text-gray-600">Checking access…</div>;
  return <>{children}</>;
}
