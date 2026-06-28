import Link from "next/link";
import { Folder } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { contarArquivosRecursivo } from "@/lib/contagem-recursiva";
import { marcarAreaVisitada } from "@/lib/novidades";
import { criarCategoria, removerCategoria } from "./actions";

export default async function DivulgacaoPage() {
  const { supabase, user, perfil } = await exigirUsuario();
  const ehAdmin = perfil?.role === "admin";

  await marcarAreaVisitada(supabase, user.id, "divulgacao");

  const { data: categoriasRaw } = await supabase
    .from("divulgacao_categories")
    .select("id, nome")
    .is("parent_id", null)
    .order("nome");
  const categorias = categoriasRaw ?? [];

  const { data: todasCategoriasRaw } = await supabase
    .from("divulgacao_categories")
    .select("id, parent_id");

  const { data: arquivosRaw } = await supabase.from("divulgacao_files").select("category_id");

  const contagemPorCategoria = contarArquivosRecursivo(todasCategoriasRaw ?? [], arquivosRaw ?? []);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Divulgação</h1>
        </div>

        {ehAdmin && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Nova pasta</h2>
            <form action={criarCategoria} className="flex items-end gap-2">
              <input
                name="nome"
                placeholder="Nome da pasta (ex: Campanha de Verão, Pneus Aro 22)"
                required
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Criar pasta
              </button>
            </form>
          </div>
        )}

        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Pastas
        </h2>
        {categorias.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-6 shadow">
            <p className="text-sm text-slate-500">Nenhuma pasta criada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categorias.map((categoria) => (
              <div
                key={categoria.id}
                className="group relative rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
              >
                <Link href={`/divulgacao/categoria/${categoria.id}`} className="block">
                  <Folder className="h-9 w-9 fill-indigo-100 text-indigo-600" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-bold uppercase text-slate-800 group-hover:underline">
                    {categoria.nome}
                  </p>
                  <p className="text-sm font-medium text-amber-700">
                    {contagemPorCategoria.get(categoria.id) ?? 0} material(is)
                  </p>
                </Link>
                {ehAdmin && (
                  <form action={removerCategoria} className="absolute right-3 top-3">
                    <input type="hidden" name="categoryId" value={categoria.id} />
                    <input type="hidden" name="parentId" value="" />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 underline opacity-0 group-hover:opacity-100"
                    >
                      Remover
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
