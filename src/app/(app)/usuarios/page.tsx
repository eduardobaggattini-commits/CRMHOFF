import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { ROTULO_PAPEL } from "@/lib/perfis";
import { removerUsuario } from "./actions";

export default async function UsuariosPage() {
  const { supabase, user: usuarioLogado } = await exigirAdmin();

  const { data: usuariosRaw } = await supabase
    .from("profiles")
    .select("id, nome, email, role, supervisor_id, gerente_id")
    .order("nome");

  const usuarios = usuariosRaw ?? [];
  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Usuários</h1>
          <Link
            href="/usuarios/novo"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Novo usuário
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow">
          {usuarios.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">Nenhum usuário encontrado.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <li key={u.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-800">
                      {u.nome} ({u.email})
                    </p>
                    <p className="text-sm text-slate-500">
                      {ROTULO_PAPEL[u.role] ?? u.role}
                      {u.supervisor_id && (
                        <> · Supervisor: {nomePorId.get(u.supervisor_id) ?? "—"}</>
                      )}
                      {u.gerente_id && (
                        <> · Gerente: {nomePorId.get(u.gerente_id) ?? "—"}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/usuarios/${u.id}/editar`}
                      className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                    >
                      Editar
                    </Link>
                    {u.id !== usuarioLogado.id && (
                      <form action={removerUsuario}>
                        <input type="hidden" name="userId" value={u.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 underline"
                        >
                          Remover
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
