"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

type Role = "admin" | "student" | null;

const linkClass = "px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors";

export default function Navbar() {
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const r = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!r.ok) return;
        const j = await r.json();
        // ✅ read from j.user.role or j.role
        const ro = String(j?.user?.role ?? j?.role ?? "").toLowerCase();
        if (ro === "admin" || ro === "student") setRole(ro as Role);
      } catch {}
    })();
    return () => controller.abort();
  }, []);

  // ✅ default to "/" while role unknown to avoid prefetching /login
  const homeHref =
    role === "admin" ? "/dashboard"
    : role === "student" ? "/student-dashboard"
    : "/";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F4C75] text-white border-b border-[#0C3D5E]">
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image
            src="/stratford%20logo.png"
            alt="Stratford logo"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <strong className="uppercase tracking-wide text-sm md:text-base whitespace-nowrap">
            STRATFORD INTERNATIONAL SCHOOL E-BOTO
          </strong>
        </div>

        <nav className="flex items-center gap-2 flex-wrap">
          {/* ✅ no prefetch on Home to avoid caching /login while role is null */}
          <Link href={homeHref} prefetch={false} className={linkClass}>
            Home
          </Link>

          {role === "admin" && (
            <>
              <Link href="/voters/add" prefetch={false} className={linkClass}>
                Add Voters
              </Link>
              <Link href="/candidates" prefetch={false} className={linkClass}>
                Add Candidate
              </Link>
              <Link href="/voters" prefetch={false} className={linkClass}>
                Voters
              </Link>
            </>
          )}

          <Link href="/about" className={linkClass}>
            About Us
          </Link>

          {/* Optional: kung gusto nimo i-avoid flicker, pwede nimo i-hide ni hangtod ma-resolve ang role */}
          {role ? (
            <LogoutButton asLink />
          ) : (
            <Link href="/login" prefetch={false} className={linkClass}>
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
