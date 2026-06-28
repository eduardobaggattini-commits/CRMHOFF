import Link from "next/link";
import { Folder, MoreVertical } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { contarArquivosRecursivo } from "@/lib/contagem-recursiva";
import { marcarAreaVisitada } from "@/lib/novidades";
import { criarCategoria, removerCategoria, renomearCategoriaRaiz } from "./actions";

export default async function TabelaPrecosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase, user, perfil } = await exigirUsuario();
  const { q } = await searchParams;
  const ehAdmin = perfil?.role === "admin";

  await marcarAreaVisitada(supabase, user.id, "tabela_precos");

  const { data: categoriasRaw } = await supabase
    .from("price_categories")
    .select("id, nome")
    .is("parent_id", null)
    .order("nome");
  const categorias = categoriasRaw ?? [];

  const { data: todasCategoriasRaw } = await supabase
    .from("price_categories")
    .select("id, parent_id");

  const { data: planilhasRaw } = await supabase
    .from("price_sheets")
    .select("id, nome_arquivo, category_id, category:price_categories(id, nome)")
    .order("nome_arquivo");

  // Cada planilha pertence a uma única categoria; ajustamos o tipo pois não
  // geramos os tipos do banco (isso exigiria a senha do banco de dados).
  const planilhas = (planilhasRaw ?? []) as unknown as Array<{
    id: string;
    nome_arquivo: string;
    category_id: string;
    category: { id: string; nome: string } | null;
  }>;

  const contagemPorCategoria = contarArquivosRecursivo(todasCategoriasRaw ?? [], planilhas);

  const termo = (q ?? "").trim().toLowerCase();
  const resultadosBusca = termo
    ? planilhas.filter(
        (p) =>
          p.nome_arquivo.toLowerCase().includes(termo) ||
          (p.category?.nome ?? "").toLowerCase().includes(termo),
      )
    : [];

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Tabela de Preços</h1>

          {ehAdmin && (
            <details className="relative">
              <summary className="cursor-pointer select-none rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 [&::-webkit-details-marker]:hidden">
                + Nova categoria
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-64 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
                <form action={criarCategoria} className="flex flex-col gap-2">
                  <input
                    name="nome"
                    placeholder="Nome da categoria"
                    required
                    autoFocus
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Criar
                  </button>
                </form>
              </div>
            </details>
          )}
        </div>

        <form action="/tabela-precos" className="mb-8">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome do arquivo ou categoria..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        {termo ? (
          <div className="rounded-2xl bg-white shadow">
            <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-800">
              Resultados para &quot;{q}&quot;
            </h2>
            {resultadosBusca.length === 0 ? (
              <p className="px-6 py-6 text-sm text-slate-500">Nada encontrado.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {resultadosBusca.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-800">{p.nome_arquivo}</p>
                      <p className="text-sm text-slate-500">{p.category?.nome}</p>
                    </div>
                    <Link
                      href={`/tabela-precos/categoria/${p.category?.id}`}
                      className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                    >
                      Ver pasta
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Categorias</h2>
            {categorias.length === 0 ? (
              <div className="rounded-2xl bg-white px-6 py-6 shadow">
                <p className="text-sm text-slate-500">Nenhuma categoria criada ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {categorias.map((categoria) => (
                  <div
                    key={categoria.id}
                    className="group relative rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
                  >
                    <Link href={`/tabela-precos/categoria/${categoria.id}`} className="block">
                      <Folder className="h-9 w-9 fill-indigo-100 text-indigo-600" strokeWidth={1.5} />
                      <p className="mt-3 text-sm font-bold uppercase text-slate-800 group-hover:underline">
                        {categoria.nome}
                      </p>
                      <p className="text-sm text-slate-500">
                        {contagemPorCategoria.get(categoria.id) ?? 0} tabela(s)
                      </p>
                    </Link>

                    {ehAdmin && (
                      <details className="absolute right-2 top-2">
                        <summary className="flex cursor-pointer select-none items-center rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 [&::-webkit-details-marker]:hidden">
                          <MoreVertical className="h-4 w-4" />
                        </summary>
                        <div className="absolute right-0 z-10 mt-1 w-48 space-y-3 rounded-xl bg-white p-3 text-left shadow-lg ring-1 ring-slate-200">
                          <form action={renomearCategoriaRaiz} className="flex flex-col gap-1.5">
                            <input type="hidden" name="categoryId" value={categoria.id} />
                            <input
                              name="nome"
                              defaultValue={categoria.nome}
                              required
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="submit"
                              className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                            >
                              Renomear
                            </button>
                          </form>
                          <form action={removerCategoria}>
                            <input type="hidden" name="categoryId" value={categoria.id} />
                            <input type="hidden" name="parentId" value="" />
                            <button
                              type="submit"
                              className="text-xs font-medium text-red-600 underline"
                            >
                              Excluir
                            </button>
                          </form>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
