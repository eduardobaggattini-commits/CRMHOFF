"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({
  href,
  label,
  icon,
  contagemNovidade,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  contagemNovidade?: number;
}) {
  const pathname = usePathname();
  const ativo = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        ativo
          ? "bg-indigo-600 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {!!contagemNovidade && contagemNovidade > 0 && (
        <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {contagemNovidade > 9 ? "9+" : contagemNovidade}
        </span>
      )}
    </Link>
  );
}
