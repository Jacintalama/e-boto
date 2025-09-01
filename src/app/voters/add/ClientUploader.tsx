// src/app/voters/add/ClientUploader.tsx
"use client";

import React, { useState } from "react";

type Level = "Elementary" | "JHS" | "SHS" | "College";

type ImportSample = {
  row: number; // 1-based index in Excel (+ header accounted)
  schoolId: string;
  fullName: string;
  reason: string;
};

type ImportResponse = {
  ok: boolean;
  message?: string;

  inserted: number;
  skippedMissing: number;
  invalid: number;
  duplicatesDb: number;
  duplicatesFile: number;

  invalidSamples?: ImportSample[];
  duplicateSamples?: ImportSample[];
};

// Relative path so cookie from :3000 is sent and Next rewrites proxy to backend
const UPLOAD_URL = "/api/voters/import";

/* ---------------- Helpers (no `any`) ---------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function toNumber(v: unknown, def = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : def;
  }
  return def;
}
function getString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function coerceImportSampleArray(v: unknown): ImportSample[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item): ImportSample | null => {
      const o = isRecord(item) ? item : {};
      const row = toNumber(o.row, 0);
      const schoolId = getString(o.schoolId) ?? "";
      const fullName = getString(o.fullName) ?? "";
      const reason = getString(o.reason) ?? "";
      // keep only rows with at least an id or name
      if (!schoolId && !fullName) return null;
      return { row, schoolId, fullName, reason };
    })
    .filter((x): x is ImportSample => x !== null);
}

export default function ClientUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<Level | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [stats, setStats] = useState<ImportResponse | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setMsg(null);
    setErr(null);
    setStats(null);
  }

  function clearFile() {
    setFile(null);
    setMsg(null);
    setErr(null);
    setStats(null);
    const input = document.getElementById("voters-file") as HTMLInputElement | null;
    if (input) input.value = "";
  }

  async function uploadFor(level: Level) {
    if (!file) {
      setErr("Please choose an Excel or CSV file first.");
      return;
    }

    // Light client-side type check
    const okExt = /\.(csv|xlsx|xls)$/i.test(file.name);
    const okMime =
      file.type === "text/csv" ||
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!okExt && !okMime) {
      setErr("Unsupported file type. Please upload .csv, .xlsx, or .xls.");
      return;
    }

    setUploading(level);
    setErr(null);
    setMsg(null);
    setStats(null);

    const form = new FormData();
    form.append("file", file); // backend reads req.file (field: "file")
    form.append("level", level);

    try {
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: form,
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        setErr("Unauthenticated. Please log in again.");
        return;
      }
      if (res.status === 403) {
        setErr("Forbidden: Admin only.");
        return;
      }

      const text = await res.text(); // accept JSON or plain text
      let raw: unknown = {};
      try {
        raw = text ? JSON.parse(text) : {};
      } catch {
        raw = { message: text };
      }

      if (!res.ok) {
        const msgStr =
          (isRecord(raw) && typeof raw.error === "string" && raw.error) ||
          (isRecord(raw) && typeof raw.message === "string" && raw.message) ||
          `Upload failed (${res.status})`;
        setErr(msgStr);
        return;
      }

      // Normalize payload shape into ImportResponse safely
      const o = isRecord(raw) ? raw : {};
      const p: ImportResponse = {
        ok: Boolean(o.ok),
        message: getString(o.message),
        inserted: toNumber(o.inserted, 0),
        skippedMissing: toNumber(o.skippedMissing, 0),
        invalid: toNumber(o.invalid, 0),
        duplicatesDb: toNumber(o.duplicatesDb, 0),
        duplicatesFile: toNumber(o.duplicatesFile, 0),
        invalidSamples: coerceImportSampleArray(o.invalidSamples),
        duplicateSamples: coerceImportSampleArray(o.duplicateSamples),
      };

      setStats(p);

      // Build a compact human summary
      const extras = [
        ["Invalid (level/year mismatch)", p.invalid],
        ["Duplicates in DB", p.duplicatesDb],
        ["Duplicates in file", p.duplicatesFile],
        ["Skipped missing required fields", p.skippedMissing],
      ]
        .filter(([, v]) => typeof v === "number")
        .map(([label, v]) => `${label}: ${v as number}`)
        .join(" · ");

      const summary =
        (p.message ? `${p.message}. ` : `Upload complete for ${level}. `) +
        `Inserted: ${p.inserted}.` +
        (extras ? ` ${extras}` : "");

      setMsg(summary);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  const levelBtn =
    "px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-60";

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold mb-4">
        Upload Voters (Elementary, JHS, SHS, College)
      </h1>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <label htmlFor="voters-file" className="block text-sm font-medium mb-2">
          Choose Excel or CSV file:
        </label>

        <div className="flex items-center gap-3">
          <input
            id="voters-file"
            type="file"
            accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={onFileChange}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 bg-white"
          />
          {file && (
            <button
              type="button"
              onClick={clearFile}
              className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
        </div>

        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: <span className="font-medium">{file.name}</span>
          </p>
        )}

        {/* Alerts */}
        {err && (
          <div className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </div>
        )}
        {msg && (
          <div className="mt-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 whitespace-pre-wrap">
            {msg}
          </div>
        )}

        {/* Stats + sample details */}
        {stats && <StatsPanel stats={stats} />}

        <div className="mt-5">
          <p className="text-sm font-medium mb-2">Upload as:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["Elementary", "JHS", "SHS", "College"] as Level[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => uploadFor(lvl)}
                disabled={!!uploading}
                className={levelBtn}
                title={`Upload this file as ${lvl}`}
              >
                {uploading === lvl ? "Uploading…" : lvl}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Tip: You can pick one file and upload it to multiple levels by clicking each button.
        </p>
      </div>
    </div>
  );
}

function StatsPanel({ stats }: { stats: ImportResponse }) {
  const hasInvalid = (stats.invalidSamples?.length ?? 0) > 0;
  const hasDupes = (stats.duplicateSamples?.length ?? 0) > 0;

  return (
    <div className="mt-4 space-y-3">
      {(hasInvalid || hasDupes) && (
        <details className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Show details (invalid & duplicate samples)
          </summary>

          <div className="mt-3 space-y-3">
            {hasInvalid && (
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Invalid samples (level / year mismatch)
                </h3>
                <ul className="list-disc pl-5 text-sm">
                  {stats.invalidSamples!.map((s, i) => (
                    <li key={`inv-${i}`}>
                      Row {s.row} — [{s.schoolId}] {s.fullName} — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasDupes && (
              <div>
                <h3 className="text-sm font-semibold mb-1">Duplicate samples</h3>
                <ul className="list-disc pl-5 text-sm">
                  {stats.duplicateSamples!.map((s, i) => (
                    <li key={`dup-${i}`}>
                      Row {s.row} — [{s.schoolId}] {s.fullName} — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}

      {/* Quick numbers overview block */}
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <Stat label="Inserted" value={stats.inserted} />
          <Stat label="Invalid (level/year)" value={stats.invalid} />
          <Stat label="Duplicates in DB" value={stats.duplicatesDb} />
          <Stat label="Duplicates in file" value={stats.duplicatesFile} />
          <Stat label="Skipped missing fields" value={stats.skippedMissing} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded border border-gray-100 px-3 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
