import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "../components/Navbar";


export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/");

  return (
    <>
      <Navbar />
      <main style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
        <h1>Dashboard</h1>
        <p>Welcome! You’re logged in.</p>
      </main>
    </>
  );
}