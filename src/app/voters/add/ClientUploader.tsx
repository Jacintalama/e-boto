// src/app/voters/add/ClientUploader.tsx
"use client";

import React, { useState } from "react";

type Level = "Elementary" | "JHS" | "SHS" | "College";

// Relative path so cookie from :3000 is sent and Next rewrites proxy to backend
const UPLOAD_URL = "/api/voters/import";

export default function ClientUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<Level | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setMsg(null);
    setErr(null);
  }

  function clearFile() {
    setFile(null);
    setMsg(null);
    setErr(null);
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
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!okExt && !okMime) {
      setErr("Unsupported file type. Please upload .csv, .xlsx, or .xls.");
      return;
    }

    setUploading(level);
    setErr(null);
    setMsg(null);

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
        // leave navigation to parent pages/guards
        return;
      }
      if (res.status === 403) {
        setErr("Forbidden: Admin only.");
        return;
      }

      const text = await res.text(); // accept JSON or plain text
      let payload: any = {};
      try { payload = JSON.parse(text); } catch { payload = { message: text }; }

      if (!res.ok) {
        setErr(payload?.error || payload?.message || `Upload failed (${res.status})`);
        return;
      }

      const inserted = payload?.inserted ?? payload?.count ?? payload?.rows ?? "";
      setMsg(
        payload?.message ||
          `Upload complete for ${level}.${inserted ? ` Inserted: ${inserted}.` : ""}`
      );
    } catch (e: any) {
      setErr(e?.message || "Upload failed.");
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
          <div className="mt-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
            {msg}
          </div>
        )}

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
