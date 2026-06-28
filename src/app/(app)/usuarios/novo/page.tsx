import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { criarUsuario } from "../actions";

export default async function NovoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const { supabase } = await exigirAdmin();

  const { data: supervisoresRaw } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("role", "supervisor")
    .order("nome");

  const { data: gerentesRaw } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("role", "gerente_comercial")
    .order("nome");

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Novo usuário</h1>
          <Link href="/usuarios" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        {erro && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
        )}

        <div className="rounded-2xl bg-white p-6 shadow">
          <UsuarioForm
            action={criarUsuario}
            supervisores={supervisoresRaw ?? []}
            gerentes={gerentesRaw ?? []}
          />
        </div>
      </div>
    </main>
  );
}
