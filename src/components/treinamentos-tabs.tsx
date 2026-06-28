"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, TrendingUp, Award } from "lucide-react";

const ABAS = [
  { href: "/meus-treinamentos", label: "Cursos", icon: BookOpen },
  { href: "/meus-treinamentos/performance", label: "Performance", icon: TrendingUp },
  { href: "/meus-treinamentos/diploma", label: "Diploma", icon: Award },
];

export function TreinamentosTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-6 bg-slate-900 px-6">
      {ABAS.map((aba) => {
        const ativo = pathname === aba.href;
        const Icon = aba.icon;
        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
              ativo
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {aba.label}
          </Link>
        );
      })}
    </nav>
  );
}
