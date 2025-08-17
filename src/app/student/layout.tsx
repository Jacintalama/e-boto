// src/app/student/layout.tsx

import Navbar from "../components/Navbar";



export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto">{children}</main>
    </>
  );
}