// src/app/candidates/ClientCandidates.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

// support both env names; fallback to localhost
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:4000";

type Level = "Elementary" | "JHS" | "SHS" | "College";
type Position =
  | "President"
  | "Vice President"
  | "Secretary"
  | "Treasurer"
  | "Auditor"
  | "Representative";

type Candidate = {
  id: string;
  level: Level | null;
  position: Position;
  partyList: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: "Male" | "Female";
  year: string;
  photoUrl?: string;
};

type CandidateApi = {
  id: string;
  level: Level | null;
  position: Position;
  partyList: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: "Male" | "Female";
  year: string | number | null | undefined;
  photoPath?: string | null;
  photoUrl?: string | null;
};

function normalizeYear(v: string | number | null | undefined): string {
  if (typeof v === "string") return v.trim() === "NaN" ? "" : v.trim();
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return "";
}

export default function CandidatesClient() {
  const router = useRouter();
  const pathname = usePathname();

  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [level, setLevel] = useState<Level | null>(null); // for modal (not the filter)
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const mapCandidate = (a: CandidateApi): Candidate => {
    const fallback =
      a.photoUrl ??
      (a.photoPath
        ? a.photoPath.startsWith("/uploads")
          ? a.photoPath // same-origin via Next rewrite
          : `${API_BASE}${a.photoPath}`
        : undefined);
    return {
      id: a.id,
      level: a.level,
      position: a.position,
      partyList: a.partyList,
      firstName: a.firstName,
      middleName: a.middleName || undefined,
      lastName: a.lastName,
      gender: a.gender,
      year: normalizeYear(a.year),
      photoUrl: fallback,
    };
  };

  async function loadCandidates() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/candidates`, {
        credentials: "include",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401 || res.status === 403) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!res.ok) {
        let msg = `Failed to load candidates (HTTP ${res.status})`;
        try {
          const ct = res.headers.get("content-type") || "";
          msg = ct.includes("application/json")
            ? (await res.json()).error || msg
            : (await res.text()) || msg;
        } catch {}
        throw new Error(msg);
      }

      const data: CandidateApi[] = await res.json();
      setCandidates(data.map(mapCandidate));
    } catch (e: any) {
      setError(e?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  // Load immediately (SSR already verified admin)
  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openFor(lvl: Level) {
    setEditingId(null);
    setLevel(lvl);
    setMenuOpen(false);
    setModalOpen(true);
    resetForm();
  }

  function openForEdit(c: Candidate) {
    setEditingId(c.id);
    setLevel(c.level ?? "College");
    setPosition(c.position);
    setPartyList(c.partyList);
    setFirstName(c.firstName);
    setMiddleName(c.middleName ?? "");
    setLastName(c.lastName);
    setGender(c.gender);
    setYear(c.year);
    setPhoto(null);
    setModalOpen(true);
  }

  // ====== FILTERS ======
  const [q, setQ] = useState(""); // text search
  const [levelFilter, setLevelFilter] = useState<"All" | Level>("All");
  const [positionFilter, setPositionFilter] = useState<"All" | Position>("All");
  const [genderFilter, setGenderFilter] = useState<"All" | "Male" | "Female">(
    "All"
  );
  const [partyFilter, setPartyFilter] = useState<"All" | string>("All");

  const partyOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const p = (c.partyList || "").trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [candidates]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = candidates.slice();

    if (levelFilter !== "All") arr = arr.filter((c) => c.level === levelFilter);
    if (positionFilter !== "All")
      arr = arr.filter((c) => c.position === positionFilter);
    if (genderFilter !== "All")
      arr = arr.filter((c) => c.gender === genderFilter);
    if (partyFilter !== "All")
      arr = arr.filter(
        (c) => (c.partyList || "").trim().toLowerCase() === partyFilter.toLowerCase()
      );

    if (needle) {
      arr = arr.filter((c) => {
        const full = `${c.firstName} ${c.middleName || ""} ${c.lastName}`
          .toLowerCase()
          .trim();
        const fields = [
          full,
          c.position.toLowerCase(),
          (c.partyList || "").toLowerCase(),
          (c.year || "").toLowerCase(),
          (c.level || "").toString().toLowerCase(),
        ].join(" ");
        return fields.includes(needle);
      });
    }
    return arr;
  }, [candidates, q, levelFilter, positionFilter, genderFilter, partyFilter]);

  function resetFilters() {
    setQ("");
    setLevelFilter("All");
    setPositionFilter("All");
    setGenderFilter("All");
    setPartyFilter("All");
  }

  // ====== FORM (modal) ======
  const [position, setPosition] = useState<Position>("President");
  const [partyList, setPartyList] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [year, setYear] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  function resetForm() {
    setPosition("President");
    setPartyList("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setGender("Male");
    setYear("");
    setPhoto(null);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!level) return;
    setSaving(true);
    setError(null);

    const yearStr = (year ?? "").toString().trim();
    if (!yearStr) {
      setSaving(false);
      return setError("Year is required.");
    }
    if (/^\d+$/.test(yearStr)) {
      setSaving(false);
      return setError(
        'Please enter a descriptive year like "1st Year" or "Grade 11", not just digits.'
      );
    }

    const formData = new FormData();
    formData.append("level", level);
    formData.append("position", position);
    formData.append("partyList", partyList.trim());
    formData.append("firstName", firstName.trim());
    formData.append("middleName", middleName.trim());
    formData.append("lastName", lastName.trim());
    formData.append("gender", gender);
    formData.append("year", yearStr);
    if (photo) formData.append("photo", photo);

    try {
      const url = editingId ? `/api/candidates/${editingId}` : `/api/candidates`;
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        body: formData,
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      const saved: CandidateApi = await res.json();
      const mapped = mapCandidate(saved);

      if (editingId) {
        setCandidates((prev) => prev.map((c) => (c.id === editingId ? mapped : c)));
      } else {
        setCandidates((prev) => [mapped, ...prev]);
      }

      closeModal();
      resetForm();
      setEditingId(null);
    } catch (e: any) {
      setError(e?.message || "Failed to save candidate");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this candidate?")) return;
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!res.ok) throw new Error(await res.text());

      setCandidates((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message || "Failed to delete");
    }
  }

  // ESC to close modal
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    if (modalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const menuBtnClass =
    "inline-flex items-center gap-2 rounded-lg bg-[#0F4C75] text-white px-3 py-2 hover:bg-[#0C3D5E] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C75]";
  const menuItemClass =
    "block w-full text-left px-3 py-2 text-sm hover:bg-gray-100";

  return (
    <>
      {/* Navbar is rendered in the server page */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Candidate List</h1>

          {/* Add Candidate dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={menuBtnClass}
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              Add Candidate
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="opacity-90"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-md bg-white text-gray-800 shadow-lg ring-1 ring-black/5 overflow-hidden z-20"
              >
                {(["Elementary", "JHS", "SHS", "College"] as Level[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={menuItemClass}
                    onClick={() => openFor(lvl)}
                    role="menuitem"
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, party, position, year…"
                className="w-56 md:w-72 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
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

            {/* Level */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              title="Filter by level"
            >
              <option value="All">All Levels</option>
              <option value="Elementary">Elementary</option>
              <option value="JHS">JHS</option>
              <option value="SHS">SHS</option>
              <option value="College">College</option>
            </select>

            {/* Position */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              title="Filter by position"
            >
              <option value="All">All Positions</option>
              {(
                [
                  "President",
                  "Vice President",
                  "Secretary",
                  "Treasurer",
                  "Auditor",
                  "Representative",
                ] as Position[]
              ).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Gender */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value as any)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              title="Filter by gender"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* Party */}
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              title="Filter by party"
            >
              <option value="All">All Parties</option>
              {partyOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 text-sm"
              title="Reset all filters"
            >
              Reset
            </button>

            <button
              className="ml-auto px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
              onClick={() => loadCandidates()}
              disabled={loading}
              title="Refresh list"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full table-auto">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="px-4 py-2 text-left w-[80px]">Photo</th>
                  <th className="px-4 py-2 text-left">Full Name</th>
                  <th className="px-4 py-2 text-left">Position</th>
                  <th className="px-4 py-2 text-left">Party</th>
                  <th className="px-4 py-2 text-left">Gender</th>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-left w-[160px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : visible.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No candidates match your filters.
                    </td>
                  </tr>
                ) : (
                  visible.map((c) => {
                    const full = `${c.firstName} ${c.middleName ? c.middleName + " " : ""}${c.lastName}`;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {c.photoUrl ? (
                            <Image
                              src={c.photoUrl}
                              alt={full}
                              width={48}
                              height={48}
                              className="rounded-md object-cover aspect-square"
                              unoptimized
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-gray-200 grid place-items-center text-xs text-gray-600">
                              N/A
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 font-medium text-gray-900">{full}</td>
                        <td className="px-4 py-2">{c.position}</td>
                        <td className="px-4 py-2">{c.partyList}</td>
                        <td className="px-4 py-2">{c.gender}</td>
                        <td className="px-4 py-2">{c.year}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100"
                              onClick={() => openForEdit(c)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDelete(c.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && level && (
        <div
          className="fixed inset-0 z-40"
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-candidate-title"
        >
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <h2 id="add-candidate-title" className="text-base md:text-lg font-semibold text-gray-900">
                  {editingId ? `Edit Candidate (${level})` : `Add Candidate (${level})`}
                </h2>
                <button onClick={closeModal} className="p-2 rounded-md hover:bg-gray-100" aria-label="Close">
                  ✕
                </button>
              </div>

              <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Position */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Position</label>
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={position}
                      onChange={(e) => setPosition(e.target.value as any)}
                      required
                    >
                      {(["President","Vice President","Secretary","Treasurer","Auditor","Representative"] as Position[]).map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Party List */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Party List</label>
                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={partyList}
                      onChange={(e) => setPartyList(e.target.value)}
                      placeholder="e.g., Buklod, Unity"
                      required
                    />
                  </div>

                  {/* First Name */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Middle Name */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Middle Name</label>
                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                  </div>

                  {/* Last Name */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Gender</label>
                    <select
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "Male" | "Female")}
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">Year</label>
                    <input
                      type="text"
                      className="rounded-md border border-gray-300 px-3 py-2"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder={
                        level === "College"
                          ? "e.g., 1st Year"
                          : level === "SHS"
                          ? "e.g., Grade 11"
                          : level === "JHS"
                          ? "e.g., Grade 9"
                          : "e.g., Grade 3"
                      }
                      pattern="^(?!\d+$).+"
                      title='Enter words like "1st Year", "Grade 11" (not just digits)'
                      required
                    />
                  </div>

                  {/* Photo */}
                  <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-medium mb-1">Candidate Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                      className="rounded-md border border-gray-300 px-3 py-2 bg-white"
                      required={!editingId}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#0F4C75] text-white hover:bg-[#0C3D5E] disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : editingId ? "Save Changes" : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
