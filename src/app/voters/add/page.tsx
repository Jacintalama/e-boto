// src/app/voters/add/page.tsx
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";
import ClientUploader from "./ClientUploader";

export default async function VotersAddPage() {
  // Read token from incoming request cookies
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login?next=/voters/add");

  // Call backend /api/auth/me with the same cookie (server-side, reliable)
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:4000";
  const r = await fetch(`${apiBase}/api/auth/me`, {
    headers: { cookie: `token=${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!r || !r.ok) redirect("/login?next=/voters/add");
  const me = await r.json();
  const role = String(me?.user?.role || "").toLowerCase();
  if (role !== "admin") redirect("/forbidden");

  // Passed: render navbar + the client uploader UI
  return (
    <>
      <Navbar />
      <ClientUploader />
    </>
  );
}
