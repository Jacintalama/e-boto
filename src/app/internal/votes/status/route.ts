import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

export async function GET() {
  const token = (await cookies()).get("token")?.value || "";
  const r = await fetch(`${API_BASE}/api/votes/status`, {
    headers: { cookie: `token=${token}` },
    cache: "no-store",
  }).catch(() => null);
  const data = r ? await r.json().catch(() => ({})) : { error: "Upstream unavailable" };
  return NextResponse.json(data, { status: r?.status ?? 502 });
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const r = await fetch(`${API_BASE}/api/votes/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `token=${token}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null);

  const data = r ? await r.json().catch(() => ({})) : { error: "Upstream unavailable" };
  return NextResponse.json(data, { status: r?.status ?? 502 });
}
