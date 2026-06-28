import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { atualizarUsuario } from "../../actions";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();

  const { data: usuario } = await supabase
    .from("profiles")
    .select("id, nome, email, role, supervisor_id, gerente_id")
    .eq("id", id)
    .single();

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

  if (!usuario) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-md">
          <p className="text-slate-600">Usuário não encontrado.</p>
          <Link href="/usuarios" className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Editar usuário</h1>
          <Link href="/usuarios" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <UsuarioForm
            action={atualizarUsuario}
            userId={usuario.id}
            supervisores={supervisoresRaw ?? []}
            gerentes={gerentesRaw ?? []}
            precisaSenha={false}
            valoresIniciais={{
              nome: usuario.nome,
              email: usuario.email,
              role: usuario.role,
              supervisor_id: usuario.supervisor_id,
              gerente_id: usuario.gerente_id,
            }}
          />
        </div>
      </div>
    </main>
  );
}
