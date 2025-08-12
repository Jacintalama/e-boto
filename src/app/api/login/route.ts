import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const username = body?.username?.toString().trim();
    const password = body?.password?.toString();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const apiBase = process.env.API_BASE;
    if (!apiBase) {
      return NextResponse.json({ error: "API_BASE is not configured" }, { status: 500 });
    }

    // TIMEOUT PARA DILI MAG-HANG
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000); // 8s

    const r = await fetch(`${apiBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin_username: username,   // map to backend
        admin_password: password,
      }),
      cache: "no-store",
      signal: controller.signal,
    }).catch((e) => {
      // convert abort/conn errors into clean 502
      throw new Error(e?.name === "AbortError" ? "Login request timed out" : e.message);
    });
    clearTimeout(t);

    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      // bubble up backend error like { error: "Invalid credentials" }
      return NextResponse.json(data, { status: r.status });
    }

    const token = data?.token as string | undefined;
    if (!token) {
      return NextResponse.json({ error: "No token from API" }, { status: 502 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: "Cannot reach API", detail: e?.message ?? "Unknown error" },
      { status: 502 }
    );
  }
}
