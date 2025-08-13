// src/app/voters/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";
import ClientVoters from "./ClientVoters";

export default async function VotersPage() {
  // 1) Read token from incoming request cookies
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login?next=/voters");

  // 2) Verify with backend using SAME cookie (same pattern as /voters/add)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";
  let me: any = null;
  try {
    const r = await fetch(`${apiBase}/api/auth/me`, {
      headers: { cookie: `token=${token}` },
      cache: "no-store",
    });
    if (!r.ok) redirect("/login?next=/voters");
    me = await r.json();
  } catch {
    redirect("/login?next=/voters");
  }

  const role = String(me?.user?.role || me?.role || "").toLowerCase();
  if (role !== "admin") redirect("/forbidden");

  // 3) Passed → render directly (no client guard)
  return (
    <>
      <Navbar />
      <ClientVoters />
    </>
  );
}
