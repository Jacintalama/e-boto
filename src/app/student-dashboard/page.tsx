// app/student-dashboard/page.tsx
export const runtime = "nodejs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";

export default async function StudentDashboard() {
  const token = (await cookies()).get("token")?.value;
  if (!token) redirect("/login?next=/student-dashboard");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  const r = await fetch(`${apiBase}/api/me`, {
    headers: { cookie: `token=${token}` },
    cache: "no-store",
  }).catch(() => null);
  if (!r || !r.ok) redirect("/login?next=/student-dashboard");
  const me = await r.json();
  if (me?.user?.role !== "student") redirect("/dashboard");

  return (
    <>
      <Navbar />
      <main className="max-w-[1200px] mx-auto p-6">
        <h1 className="text-xl font-semibold">Student Dashboard</h1>
        <p>Welcome, student! 🎓</p>
      </main>
    </>
  );
}
