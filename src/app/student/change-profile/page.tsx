// app/student/change-profile/page.tsx
export const runtime = "nodejs";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import StudentChangeProfileClient from "./StudentChangeProfileClient";


type Me = { user?: { role?: string | null } };

export default async function Page() {
  // read auth cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login?next=/student/change-profile");

  // API base
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000";

  // verify role
  const meRes = await fetch(`${apiBase}/api/auth/me`, {
    headers: { cookie: `token=${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (!meRes || !meRes.ok) redirect("/login?next=/student/change-profile");

  const me = (await meRes.json()) as Me;
  const role = (me?.user?.role || "").toLowerCase();

  // ⛔ kick out non-students
  if (role !== "student") redirect("/dashboard");

  // ✅ render the client UI
  return <StudentChangeProfileClient />;
}
