import { cookies, headers } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      "http://localhost:4000";

    const token = (await cookies()).get("token")?.value || "";

    const res = await fetch(`${apiBase}/api/votes/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // forward the auth cookie to the API server
        cookie: token ? `token=${token}` : "",
        // optional: forward some headers
        "x-forwarded-for": (await headers()).get("x-forwarded-for") || "",
        "user-agent": (await headers()).get("user-agent") || "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
} catch (e) {
  const message =
    e instanceof Error ? e.message : typeof e === "string" ? e : "Proxy error";

  return new Response(JSON.stringify({ error: message }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
}
