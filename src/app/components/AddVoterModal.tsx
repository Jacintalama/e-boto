"use client";
import React, { useState } from "react";

export type Level = "Elementary" | "JHS" | "SHS" | "College";

export type Voter = {
  id: string;
  schoolId: string;
  fullName: string;
  course: string | null;
  year: string;
  status: 0 | 1;
  department: Level;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (v: Voter) => void;
  apiBase: string;
  defaultDepartment?: Level;
};

export default function AddVoterModal({
  open,
  onClose,
  onCreated,
  apiBase,
  defaultDepartment = "College",
}: Props) {
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [fullName, setFullName] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [department, setDepartment] = useState<Level>(defaultDepartment);
  const [status, setStatus] = useState<0 | 1>(0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDepartment(defaultDepartment);
  }, [open, defaultDepartment]);

  function genTemp(len = 10) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPassword(out);
    setConfirm(out);
    setShowPwd(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setErr(null);

    if (!schoolId.trim() || !fullName.trim() || !year.trim()) {
      setErr("School ID, Full Name, and Year are required.");
      return;
    }
    if (!["Elementary", "JHS", "SHS", "College"].includes(department)) {
      setErr("Please select a department.");
      return;
    }
    if (!password) {
      setErr("Password is required.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        schoolId: schoolId.trim(),
        fullName: fullName.trim(),
        course: course.trim() || null,
        year: year.trim(),
        status,
        department,
        password, // backend will bcrypt-hash this
      };

      const r = await fetch(`${apiBase}/api/voters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data?.error || "Failed to create voter");
      }

      onCreated(data as Voter);
      // reset
      setSchoolId("");
      setPassword("");
      setConfirm("");
      setShowPwd(false);
      setFullName("");
      setCourse("");
      setYear("");
      setStatus(0);
      setDepartment(defaultDepartment);
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to create voter");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40" aria-modal="true" role="dialog" aria-labelledby="add-voter-title">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 id="add-voter-title" className="text-base md:text-lg font-semibold text-gray-900">
              Manual Voter Insertion
            </h2>
            <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100" aria-label="Close">✕</button>
          </div>

          <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* School ID */}
              <div>
                <label className="text-sm font-medium mb-1 block">School ID</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-sm font-medium mb-1 block">Department</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as Level)}
                  required
                >
                  {["College", "Elementary", "SHS", "JHS"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* Course */}
              <div>
                <label className="text-sm font-medium mb-1 block">Course</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder={department === "College" ? "e.g., BSIT" : "—"}
                />
              </div>

              {/* Year (required by DB) */}
              <div>
                <label className="text-sm font-medium mb-1 block">Year</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder={
                    department === "College"
                      ? "e.g., 1st Year"
                      : department === "SHS"
                      ? "e.g., Grade 11"
                      : department === "JHS"
                      ? "e.g., Grade 9"
                      : "e.g., Grade 3"
                  }
                  required
                />
              </div>

              {/* Password + helpers */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Password</label>
                <div className="flex gap-2">
                  <input
                    type={showPwd ? "text" : "password"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                  <button
                    type="button"
                    onClick={() => genTemp(10)}
                    className="px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100"
                    title="Generate temporary password"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Confirm Password</label>
                <input
                  type={showPwd ? "text" : "password"}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Voting Status</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus(status === 1 ? 0 : 1)}
                    className={`px-3 py-1.5 rounded-md border ${
                      status === 1
                        ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                        : "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {status === 1 ? "Mark Not Voted" : "Mark Voted"}
                  </button>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      status === 1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {status === 1 ? "1 (Voted)" : "0 (Not Voted)"}
                  </span>
                </div>
              </div>
            </div>

            {err && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {err}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#0F4C75] text-white hover:bg-[#0C3D5E] disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving…" : "Create Voter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
