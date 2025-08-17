// app/student/change-profile/StudentChangeProfileClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function StudentChangeProfileClient() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const nextLoginHref = useMemo(
    () => `/login?next=${encodeURIComponent("/student/change-profile")}`,
    []
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setMsg(null);
    setErr(null);
    setNeedsLogin(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErr("Complete all fields.");
      return;
    }
    if (newPassword.length < 4) {
      setErr("New password must be at least 4 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setErr("New password must be different from current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const j = await r.json().catch(() => ({}));

      if (r.status === 401) {
        setNeedsLogin(true);
        setErr(j?.error || "Your session expired. Please log in again.");
        return;
      }
      if (!r.ok) {
        setErr(j?.error || "Failed to update password.");
        return;
      }

      setMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConf, setShowConf] = useState(false);

  function Eye({ open }: { open: boolean }) {
    return (
      <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
        {open ? (
          <>
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M1 12s4-7 11-7c2.6 0 4.9.9 6.8 2.1M23 12s-4 7-11 7c-2.6 0-4.9-.9-6.8-2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9.5 9.5A3.5 3.5 0 0012 15a3.5 3.5 0 003-1.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </>
        )}
      </svg>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-1">Change Password</h1>
      <p className="text-sm text-gray-600 mb-6">Update your password.</p>

      {msg && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-green-800">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
          {err}
          {needsLogin && (
            <span className="ml-2">
              <Link className="underline" href={nextLoginHref}>
                Login again
              </Link>
            </span>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm mb-1">Current Password</label>
          <div className="relative">
            <input
              type={showCur ? "text" : "password"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0F4C75]"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCur((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 focus:outline-none"
              aria-label={showCur ? "Hide current password" : "Show current password"}
              aria-pressed={showCur}
              title={showCur ? "Hide password" : "Show password"}
            >
              <Eye open={!showCur} />
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm mb-1">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0F4C75]"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={4}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 focus:outline-none"
              aria-label={showNew ? "Hide new password" : "Show new password"}
              aria-pressed={showNew}
              title={showNew ? "Hide password" : "Show password"}
            >
              <Eye open={!showNew} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">At least 4 characters.</p>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-sm mb-1">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConf ? "text" : "password"}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-[#0F4C75]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConf((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 focus:outline-none"
              aria-label={showConf ? "Hide confirm password" : "Show confirm password"}
              aria-pressed={showConf}
              title={showConf ? "Hide password" : "Show password"}
            >
              <Eye open={!showConf} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-md bg-[#0F4C75] text-white px-4 py-2 font-medium hover:bg-[#0C3D5E] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
