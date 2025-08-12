"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { variant?: "link" | "button" };

export default function LogoutButton({ variant = "link" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.replace("/");
      router.refresh();
      setLoading(false);
    }
  }

  const cls =
    variant === "link"
      ? "text-white px-2.5 py-1.5 rounded-md hover:bg-indigo-600/90 transition-colors"
      : "text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-2 rounded-md";

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={`${cls} ${loading ? "opacity-70" : ""}`}
      title="Logout"
    >
      {loading ? "Logging out…" : "Logout"}
    </button>
  );
}
