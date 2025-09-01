// src/app/candidates/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import CandidatesClient from "./ClientCandidates";

/* Types */
type MeResponse = {
  user?: {
    id?: string | number;
    username?: string;
    schoolId?: string;
    role?: "admin" | "student" | string;
  };
  error?: string;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function getUserObject(o: unknown): Record<string, unknown> | null {
  if (!isObject(o)) return null;
  const u = (o as Record<string, unknown>).user;
  return isObject(u) ? u : null;
}

function hasTopLevelRole(o: unknown): o is { role?: unknown } {
  return isObject(o) && "role" in (o as Record<string, unknown>);
}

export default async function CandidatesPage() {
  // 1) Read token from incoming request cookies
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login?next=/candidates");

  // 2) Verify with backend using SAME cookie (same pattern as voters/add)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";

  let me: MeResponse | null = null;
  try {
    const r = await fetch(`${apiBase}/api/auth/me`, {
      headers: { cookie: `token=${token}` },
      cache: "no-store",
    });
    if (!r.ok) redirect("/login?next=/candidates");

    const data: unknown = await r.json().catch(() => null);

    // Normalize into MeResponse shape without using `any`
    const userObj = getUserObject(data);
    if (userObj) {
      const role =
        typeof userObj.role === "string" ? (userObj.role as string) : undefined;
      const id =
        typeof userObj.id === "string" || typeof userObj.id === "number"
          ? (userObj.id as string | number)
          : undefined;
      const username =
        typeof userObj.username === "string"
          ? (userObj.username as string)
          : undefined;
      const schoolId =
        typeof userObj.schoolId === "string"
          ? (userObj.schoolId as string)
          : undefined;

      me = { user: { id, username, schoolId, role } };
    } else if (hasTopLevelRole(data)) {
      // After the type guard, `data` is { role?: unknown }
      const topRole = typeof data.role === "string" ? data.role : undefined;
      me = topRole ? { user: { role: topRole } } : null;
    } else {
      me = null;
    }
  } catch {
    redirect("/login?next=/candidates");
  }

  const role = String(me?.user?.role ?? "").toLowerCase();
  if (role !== "admin") redirect("/forbidden");

  // 3) Passed → render client UI
  return (
    <>
      <Navbar />
      <CandidatesClient />
    </>
  );
}
