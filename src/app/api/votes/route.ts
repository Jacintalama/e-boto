import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:4000";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();                    // 👈 await
  const token = cookieStore.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ct = req.headers.get("content-type") || "";
  let candidateId: string | null = null;

  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({} as any));
    candidateId = (body?.candidateId ?? body?.id ?? body?.candidate_id ?? "").toString().trim() || null;
  } else {
    const form = await req.formData().catch(() => null);
    if (form) {
      candidateId = (form.get("candidateId") ?? form.get("id") ?? form.get("candidate_id") ?? "")
        .toString()
        .trim() || null;
    }
  }

  if (!candidateId) {
    return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
  }

  const r = await fetch(`${API_BASE}/api/votes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,              // forward JWT
    },
    body: JSON.stringify({ candidateId }),           // ensure correct key is sent downstream
    cache: "no-store",
  }).catch(() => null);

  if (!r) return NextResponse.json({ error: "Upstream unavailable" }, { status: 502 });
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
