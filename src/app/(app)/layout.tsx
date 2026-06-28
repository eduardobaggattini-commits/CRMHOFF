import {
  Home,
  GraduationCap,
  Users,
  Workflow,
  Tags,
  Scale,
  Megaphone,
  MapPin,
  Target,
  UserCog,
  LogOut,
} from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { NavLink } from "@/components/nav-link";
import { ROTULO_PAPEL, podeAcompanharEquipe } from "@/lib/perfis";
import { obterNovidades } from "@/lib/novidades";
import { logout } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, perfil } = await exigirUsuario();
  const papel = perfil?.role ?? "vendedor";
  const ehAdmin = papel === "admin";

  const linkTreinamentos = podeAcompanharEquipe(papel) ? "/admin/treinamentos" : "/meus-treinamentos";
  const { contagemPorArea } = await obterNovidades(supabase, user.id, papel);

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-slate-900 text-slate-200">
        <div className="flex items-center gap-2 px-5 py-6 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            C
          </span>
          CRM
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <NavLink href="/" label="Home" icon={<Home className="h-4 w-4" />} />
          <NavLink href="/pipeline" label="Pipeline" icon={<Workflow className="h-4 w-4" />} />
          <NavLink href="/visitas" label="Visitas" icon={<MapPin className="h-4 w-4" />} />
          <NavLink
            href="/shopping-de-preco"
            label="Shopping de Preço"
            icon={<Scale className="h-4 w-4" />}
          />
          <NavLink
            href="/tabela-precos"
            label="Tabela de Preços"
            icon={<Tags className="h-4 w-4" />}
            contagemNovidade={contagemPorArea.tabela_precos}
          />
          <NavLink
            href="/divulgacao"
            label="Divulgação"
            icon={<Megaphone className="h-4 w-4" />}
            contagemNovidade={contagemPorArea.divulgacao}
          />
          <NavLink
            href={linkTreinamentos}
            label="Treinamentos"
            icon={<GraduationCap className="h-4 w-4" />}
            contagemNovidade={contagemPorArea.treinamentos}
          />
          <NavLink href="/metas" label="SalesGrid / Metas" icon={<Target className="h-4 w-4" />} />
          <NavLink href="/clientes" label="Clientes" icon={<Users className="h-4 w-4" />} />
          {ehAdmin && (
            <NavLink href="/usuarios" label="Usuários" icon={<UserCog className="h-4 w-4" />} />
          )}
        </nav>

        <div className="border-t border-slate-800 px-5 py-4">
          <p className="text-sm font-medium text-white">{perfil?.nome}</p>
          <p className="text-xs text-slate-400">{ROTULO_PAPEL[papel]}</p>
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto bg-slate-50">{children}</div>
    </div>
  );
}
