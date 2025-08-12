"use client";
import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./LogoutButton";

const linkClass =
  "px-2.5 py-1.5 rounded-md hover:bg-white/10 transition-colors";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#0F4C75] text-white border-b border-[#0C3D5E]">
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3">
        {/* LEFT: logo + name */}
        <div className="flex items-center gap-2">
          {/* Put the file in /public and use one of the two src lines below */}
          {/* Preferred (rename the file): */}
          {/* <Image src="/stratford-logo.png" alt="Stratford logo" width={32} height={32} className="rounded-lg" priority /> */}
          {/* If keeping the space in the filename: */}
          <Image
            src="/stratford%20logo.png"
            alt="Stratford logo"
            width={32}
            height={32}
            className="rounded-lg"
            priority
          />
          <strong className="uppercase tracking-wide text-sm md:text-base whitespace-nowrap">
            STRATFORD INTERNATIONAL SCHOOL E-BOTO
          </strong>
        </div>

        {/* RIGHT: menu + logout */}
        <nav className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard" className={linkClass}>Home</Link>
          <Link href="/voters" className={linkClass}>Add Voters</Link>
          <Link href="/candidates" className={linkClass}>Add Candidate</Link>
          <Link href="/staff" className={linkClass}>Add Staff</Link>
          <Link href="/voters" className={linkClass}>Voters</Link>
          <Link href="/about" className={linkClass}>About Us</Link>
          <LogoutButton variant="link" />
        </nav>
      </div>
    </header>
  );
}
