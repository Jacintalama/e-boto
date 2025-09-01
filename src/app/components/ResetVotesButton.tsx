"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  /** Pass from server: e.g. "http://192.168.1.236:4000" */
  apiBase?: string;
};

type ResetResponse = {
  deletedVotes?: number;
  votersReset?: number;
  error?: string;
  [key: string]: unknown; // allow extra fields without using `any`
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function apiUrl(base: string | undefined, path: string) {
  const b = (base || "").trim();
  const withProto = /^https?:\/\//i.test(b) ? b : b ? `http://${b}` : "";
  // If no base provided, allow calling a relative proxy path instead
  return withProto ? new URL(path, withProto).toString() : path;
}

export default function ResetVotesButton({ apiBase = "" }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onClick() {
    setMsg(null);
    setErr(null);

    const yes = window.confirm(
      "This will erase ALL votes and mark everyone as NOT VOTED.\n\nAre you sure?"
    );
    if (!yes) return;

    setLoading(true);
    try {
      // Prefer direct API if apiBase is given; if not, this will call a relative proxy (e.g. /internal/votes/reset)
      const url = apiUrl(apiBase, "/api/votes/reset");

      const res = await fetch(url, {
        method: "POST",
        credentials: apiBase ? "include" : "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ close: false }), // set true to also close voting
      });

      // ---- typed payload (no `any`) ----
      let payload: ResetResponse = {};
      const text = await res.text();
      try {
        const parsed: unknown = text ? JSON.parse(text) : {};
        payload = isRecord(parsed) ? (parsed as ResetResponse) : {};
      } catch {
        payload = { raw: text } as ResetResponse;
      }

      if (!res.ok) {
        throw new Error(
          (typeof payload.error === "string" && payload.error) ||
            `HTTP ${res.status}${res.statusText ? " - " + res.statusText : ""}`
        );
      }

      const deleted = typeof payload.deletedVotes === "number" ? payload.deletedVotes : 0;
      const reset = typeof payload.votersReset === "number" ? payload.votersReset : 0;

      setMsg(`Reset successful. Deleted votes: ${deleted}. Voters reset: ${reset}.`);

      // Refresh data shown in server components
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to reset votes";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={loading}
        className={`rounded-lg px-3 py-2 border ${
          loading
            ? "opacity-70 cursor-not-allowed"
            : "hover:bg-red-50 hover:border-red-400"
        } border-red-300 text-red-700 font-medium`}
        title="Erase all votes and mark everyone as not voted"
      >
        {loading ? "Resetting…" : "Reset Votes (Danger)"}
      </button>

      {msg && <span className="text-sm text-green-700">{msg}</span>}
      {err && <span className="text-sm text-red-600">{err}</span>}
    </div>
  );
}
