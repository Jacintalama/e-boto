// Force Node.js runtime so cookies() works predictably
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

export async function POST(req: NextRequest) {
  // Read cookie token (your Express reads req.cookies.token)
  const token = (await cookies()).get("token")?.value || "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Keep original body as-is (JSON, form, urlencoded… whatever the client sent)
  const raw = await req.text().catch(() => "");

  // Build headers for upstream: preserve content-type, add cookie + bearer
  const headers = new Headers();
  const ct = req.headers.get("content-type");
  if (ct) headers.set("Content-Type", ct);
  headers.set("cookie", `token=${token}`);
  headers.set("Authorization", `Bearer ${token}`);

  // Forward the request to Express exactly
  const upstream = await fetch(`${API_BASE}/api/votes`, {
    method: "POST",
    headers,
    body: raw,
    cache: "no-store",
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
  }

  const respText = await upstream.text();
  const res = new NextResponse(respText, { status: upstream.status });
  // Mirror upstream content-type if available (default to JSON)
  res.headers.set("content-type", upstream.headers.get("content-type") || "application/json");
  return res;
}
