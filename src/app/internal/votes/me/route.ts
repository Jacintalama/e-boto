export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

export async function GET(_req: NextRequest) {
  const token = (await cookies()).get("token")?.value || "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const upstream = await fetch(`${API_BASE}/api/votes/me`, {
    headers: {
      cookie: `token=${token}`,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
  }

  const respText = await upstream.text();
  const res = new NextResponse(respText, { status: upstream.status });
  res.headers.set("content-type", upstream.headers.get("content-type") || "application/json");
  return res;
}
