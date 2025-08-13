// src/app/forbidden/page.tsx
export const runtime = "nodejs";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-xl text-center">
        <div className="text-7xl font-black text-red-500">403</div>
        <h1 className="mt-2 text-2xl font-semibold">Forbidden</h1>
        <p className="mt-3 text-gray-600">You don’t have permission to access this page.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/student-dashboard" className="px-4 py-2 rounded-md bg-[#0F4C75] text-white">
            Go to Student Home
          </Link>
          <Link href="/login" className="px-4 py-2 rounded-md border border-gray-300">
            Switch Account
          </Link>
        </div>
      </div>
    </main>
  );
}
