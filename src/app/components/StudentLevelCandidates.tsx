// app/components/StudentLevelCandidates.tsx
"use client";

import Image from "next/image";
import * as React from "react";

type Level = "Elementary" | "JHS" | "SHS" | "College";
type Position =
  | "President"
  | "Vice President"
  | "Secretary"
  | "Treasurer"
  | "Auditor"
  | "Representative";

type Item = {
  id: string;
  level: Level | null;
  position: Position;
  partyList: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: "Male" | "Female";
  year: string;
  photo: string | null;
};

type Props = {
  items: Item[];
  voted: Record<string, string>;
  canVote?: boolean;
};

const ORDER: Position[] = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Representative",
];

/* ---------------- Helpers (no `any`) ---------------- */
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function extractApiError(u: unknown): string | null {
  if (!isObject(u)) return null;
  const e = u.error;
  const m = u.message;
  if (typeof e === "string") return e;
  if (typeof m === "string") return m;
  return null;
}
function extractExistingId(u: unknown): string | null {
  if (!isObject(u)) return null;
  const ex = u.existing;
  if (isObject(ex) && typeof ex.candidateId === "string") return ex.candidateId;
  return null;
}

const StudentLevelCandidates: React.FC<Props> = ({
  items,
  voted,
  canVote = true,
}) => {
  const [mounted, setMounted] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [myVotes, setMyVotes] = React.useState<Record<string, string>>(
    voted || {}
  );

  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const grouped = React.useMemo(
    () =>
      ORDER.map((pos) => ({
        pos,
        items: items.filter((c) => c.position === pos),
      })),
    [items]
  );

  async function castVote(candidateId: string, position: Position) {
    if (!candidateId) {
      setErr("Invalid candidate. Please refresh.");
      return;
    }
    if (myVotes[position]) return;

    setBusyId(candidateId);
    setErr(null);
    try {
      const r = await fetch("/internal/votes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: String(candidateId) }),
      });

      // Parse as text first, then safely JSON-parse to unknown
      const raw = await r.text();
      let j: unknown = null;
      try {
        j = raw ? JSON.parse(raw) : null;
      } catch {
        j = null;
      }

      if (r.status === 201) {
        setMyVotes((p) => ({ ...p, [position]: candidateId }));
        return;
      }

      if (!r.ok) {
        if (r.status === 409) {
          const existingId = extractExistingId(j);
          setMyVotes((p) =>
            existingId ? { ...p, [position]: existingId } : p
          );
          setErr(
            extractApiError(j) || `You already voted for ${position}.`
          );
          return;
        }
        if (r.status === 401) {
          setErr(extractApiError(j) || "Unauthorized. Please log in again.");
          return;
        }
        if (r.status === 403) {
          setErr(extractApiError(j) || "Forbidden.");
          return;
        }
        setErr(extractApiError(j) || "Failed to submit vote.");
        return;
      }

      // Fallback (shouldn't reach here because 201 already handled)
      setErr(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error.";
      setErr(msg);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      {grouped.map(
        (g) =>
          g.items.length > 0 && (
            <section
              key={g.pos}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="mb-4 text-center">
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0F4C75]">
                  {g.pos}
                </h3>
                <span className="mt-1 block text-xs text-gray-600">
                  {g.items.length}{" "}
                  {g.items.length === 1 ? "candidate" : "candidates"}
                </span>
              </div>

              {/* Centered, responsive grid */}
              <div className="mx-auto">
                <div className="grid justify-center gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,320px))]">
                  {g.items.map((c, idx) => {
                    const full = `${c.firstName} ${
                      c.middleName ? c.middleName + " " : ""
                    }${c.lastName}`.trim();
                    const chosenId = myVotes[c.position];
                    const isChosen = chosenId === c.id;
                    const locked = Boolean(chosenId);

                    return (
                      <article
                        key={c.id}
                        className={`group relative flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                          mounted
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-4"
                        } hover:shadow-md`}
                        style={{
                          transitionDuration: "450ms",
                          transitionDelay: `${idx * 60}ms`,
                        }}
                      >
                        {/* PHOTO */}
                        <div className="relative w-full aspect-square bg-gray-100">
                          {c.photo ? (
                            <Image
                              src={c.photo}
                              alt={full}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center text-gray-400 text-xs">
                              No photo
                            </div>
                          )}
                        </div>

                        {/* BODY */}
                        <div className="flex flex-1 flex-col p-3">
                          <div
                            className={`text-center font-semibold ${
                              isChosen ? "text-green-700" : "text-gray-900"
                            }`}
                            title={full}
                          >
                            {full}
                          </div>
                          <div className="mt-1 text-center text-xs text-gray-600">
                            {(c.partyList || "Independent").trim() ||
                              "Independent"}{" "}
                            • {c.gender}
                          </div>
                          {c.year && (
                            <div className="mt-0.5 text-center text-xs text-gray-500">
                              {c.year}
                            </div>
                          )}

                          {/* BUTTON */}
                          <div className="mt-auto pt-3">
                            <button
                              onClick={() => castVote(c.id, c.position)}
                              disabled={
                                !canVote ||
                                (locked && !isChosen) ||
                                busyId === c.id
                              }
                              className={`inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition
                                ${
                                  !canVote
                                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                                    : isChosen
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : locked
                                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                                    : "bg-[#0F4C75] text-white hover:bg-[#0C3D5E]"
                                }`}
                            >
                              {!canVote
                                ? "Voting Closed"
                                : busyId === c.id
                                ? "Submitting…"
                                : isChosen
                                ? "Voted"
                                : locked
                                ? "Already Voted"
                                : "Vote"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )
      )}
    </div>
  );
};

export default StudentLevelCandidates;
