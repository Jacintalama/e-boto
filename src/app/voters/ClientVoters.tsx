// src/app/voters/ClientVoters.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AddVoterModal, { Level, Voter } from "../components/AddVoterModal";

export default function ClientVoters() {
  const router = useRouter();
  const pathname = usePathname();

  // UI state
  const [level, setLevel] = useState<Level>("College");
  const [rows, setRows] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // NEW: search & filter
  const [q, setQ] = useState(""); // text search
  const [statusFilter, setStatusFilter] = useState<"all" | "voted" | "not">("all");

  // edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Voter | null>(null);
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  // create modal
  const [createOpen, setCreateOpen] = useState(false);

  // edit form
  const [form, setForm] = useState({
    fullName: "",
    course: "",
    year: "",
    status: 0 as 0 | 1,
    password: "",
    confirmPassword: "",
    showPwd: false,
  });
  const [formErr, setFormErr] = useState<string | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  async function load(dep: Level) {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/voters?department=${encodeURIComponent(dep)}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.status === 403) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!res.ok) {
        let msg = `Failed to load voters (HTTP ${res.status})`;
        try {
          const ct = res.headers.get("content-type") || "";
          msg = ct.includes("application/json") ? (await res.json()).error || msg : (await res.text()) || msg;
        } catch {}
        throw new Error(msg);
      }

      const data: Voter[] = await res.json();
      data.forEach((d: any) => (d.status = d.status === 1 ? 1 : 0));
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "Failed to load voters");
    } finally {
      setLoading(false);
    }
  }

  // load on level change
  useEffect(() => {
    load(level);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  const btn = (l: Level) =>
    `px-3 py-1.5 rounded-md border ${
      level === l ? "bg-[#0F4C75] text-white border-[#0F4C75]" : "border-gray-300 hover:bg-gray-100"
    }`;

  function openEdit(v: Voter) {
    setEditing(v);
    setForm({
      fullName: v.fullName,
      course: v.course ?? "",
      year: v.year,
      status: v.status,
      password: "",
      confirmPassword: "",
      showPwd: false,
    });
    setFormErr(null);
    setFormMsg(null);
    setModalOpen(true);
  }
  function closeEdit() {
    setModalOpen(false);
    setEditing(null);
    setSaving(false);
    setFormErr(null);
    setFormMsg(null);
  }
  function setField<K extends keyof typeof form>(k: K, val: (typeof form)[K]) {
    setForm((p) => ({ ...p, [k]: val }));
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormErr(null);
    setFormMsg(null);

    if (!form.fullName.trim() || !form.year.trim()) {
      setSaving(false);
      return setFormErr("Full Name and Year are required.");
    }
    if (form.password || form.confirmPassword) {
      if (form.password !== form.confirmPassword) {
        setSaving(false);
        return setFormErr("Passwords do not match.");
      }
      if (form.password.length < 4) {
        setSaving(false);
        return setFormErr("Password must be at least 4 characters.");
      }
    }

    const payload: any = {
      fullName: form.fullName.trim(),
      course: form.course.trim() || null,
      year: form.year.trim(),
      status: form.status,
    };
    if (form.password) payload.password = form.password;

    try {
      let r = await fetch(`/api/voters/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        // fallback if backend splits status route
        if ("status" in payload) {
          const rs = await fetch(`/api/voters/${editing.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ status: payload.status }),
          });
          if (!rs.ok) throw new Error(await r.text());
        }
        await fetch(`/api/voters/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            fullName: payload.fullName,
            course: payload.course,
            year: payload.year,
            ...(payload.password ? { password: payload.password } : {}),
          }),
        }).catch(() => {});
      }

      setRows((prev) =>
        prev.map((x) =>
          x.id === editing.id
            ? { ...x, fullName: payload.fullName, course: payload.course, year: payload.year, status: payload.status }
            : x
        )
      );

      setFormMsg("Changes saved.");
      setTimeout(() => closeEdit(), 600);
    } catch (e: any) {
      setFormErr(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function removeVoter(v: Voter) {
    if (!confirm(`Delete voter "${v.fullName}"?`)) return;
    try {
      setDelId(v.id);
      const res = await fetch(`/api/voters/${v.id}`, { method: "DELETE", credentials: "include" });

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.status === 403) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      setRows((prev) => prev.filter((x) => x.id !== v.id));
    } catch (e: any) {
      alert(e?.message || "Failed to delete");
    } finally {
      setDelId(null);
    }
  }

  // counts
  const totalVoted = rows.filter((r) => r.status === 1).length;

  // NEW: derive visible rows via memo (text + status)
  const visibleRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "voted" && r.status !== 1) return false;
      if (statusFilter === "not" && r.status !== 0) return false;

      if (!needle) return true;
      const hay = `${r.schoolId} ${r.fullName} ${r.course ?? ""} ${r.year} ${r.department}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q, statusFilter]);

  const visibleVoted = visibleRows.filter((r) => r.status === 1).length;

  return (
    <>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold">Voters</h1>
            <p className="text-xs text-gray-600">
              Department: <b>{level}</b> • Showing {visibleRows.length} of {rows.length} • Voted (shown): {visibleVoted} • Voted (total): {totalVoted}
            </p>
          </div>

          {/* NEW: filters row */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {(["Elementary", "JHS", "SHS", "College"] as Level[]).map((l) => (
              <button key={l} className={btn(l)} onClick={() => setLevel(l)}>
                {l}
              </button>
            ))}

            {/* search input */}
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search ID, name, course, year…"
                className="w-56 md:w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-md hover:bg-gray-100"
                  aria-label="Clear search"
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            {/* status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              title="Filter by status"
            >
              <option value="all">All</option>
              <option value="voted">Voted</option>
              <option value="not">Not Voted</option>
            </select>

            <button
              className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={() => setCreateOpen(true)}
              title="Insert a voter manually"
            >
              Manually Add Voter
            </button>
            <button
              className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={() => load(level)}
              disabled={loading}
              title="Refresh"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {err && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full table-auto">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="px-4 py-2 text-left">School ID</th>
                  <th className="px-4 py-2 text-left">Full Name</th>
                  <th className="px-4 py-2 text-left">Course</th>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-left">Status (1/0)</th>
                  <th className="px-4 py-2 text-left">Department</th>
                  <th className="px-4 py-2 text-left w-[200px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No voters found.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{v.schoolId}</td>
                      <td className="px-4 py-2">{v.fullName}</td>
                      <td className="px-4 py-2">{v.course ?? "-"}</td>
                      <td className="px-4 py-2">{v.year}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            v.status === 1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {v.status} {v.status === 1 ? "(Voted)" : "(Not Voted)"}
                        </span>
                      </td>
                      <td className="px-4 py-2">{v.department}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
                            onClick={() => openEdit(v)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                            onClick={() => removeVoter(v)}
                            disabled={delId === v.id}
                          >
                            {delId === v.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <AddVoterModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(v) => setRows((prev) => [v, ...prev])}
        apiBase="" // force relative "/api/..." inside modal
        defaultDepartment={level}
      />

      {/* Edit Modal placeholder (your existing modal code) */}
      {modalOpen && editing && <></>}
    </>
  );
}
