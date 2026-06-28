import Link from "next/link";
import { Folder, FileText, Settings } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { contarArquivosRecursivo } from "@/lib/contagem-recursiva";
import { marcarAreaVisitada } from "@/lib/novidades";
import { UploadDiretoForm } from "@/components/upload-direto-form";
import { SubstituirDiretoForm } from "@/components/substituir-direto-form";
import { criarCategoria, removerCategoria } from "../../actions";
import {
  renomearCategoria,
  registrarArquivosEnviados,
  registrarSubstituicaoArquivo,
  removerArquivo,
  moverArquivo,
} from "./actions";

const EXTENSOES_IMAGEM = [".jpg", ".jpeg", ".png"];

function ehImagem(nomeArquivo: string) {
  const nome = nomeArquivo.toLowerCase();
  return EXTENSOES_IMAGEM.some((ext) => nome.endsWith(ext));
}

export default async function CategoriaDivulgacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: categoryId } = await params;
  const { supabase, user, perfil } = await exigirUsuario();
  const ehAdmin = perfil?.role === "admin";

  await marcarAreaVisitada(supabase, user.id, "divulgacao");

  const { data: categoria } = await supabase
    .from("divulgacao_categories")
    .select("id, nome, parent_id")
    .eq("id", categoryId)
    .single();

  if (!categoria) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-600">Pasta não encontrada.</p>
          <Link
            href="/divulgacao"
            className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  // Monta o caminho (breadcrumb) subindo de pai em pai até a raiz.
  const caminho: { id: string; nome: string }[] = [{ id: categoria.id, nome: categoria.nome }];
  let paiId = categoria.parent_id;
  while (paiId) {
    const { data: pai } = await supabase
      .from("divulgacao_categories")
      .select("id, nome, parent_id")
      .eq("id", paiId)
      .single();
    if (!pai) break;
    caminho.unshift({ id: pai.id, nome: pai.nome });
    paiId = pai.parent_id;
  }

  const { data: subpastasRaw } = await supabase
    .from("divulgacao_categories")
    .select("id, nome")
    .eq("parent_id", categoryId)
    .order("nome");
  const subpastas = subpastasRaw ?? [];

  const { data: todasCategoriasRaw } = await supabase
    .from("divulgacao_categories")
    .select("id, parent_id");

  const { data: todosArquivosRaw } = await supabase.from("divulgacao_files").select("category_id");

  const contagemPorSubpasta = contarArquivosRecursivo(
    todasCategoriasRaw ?? [],
    todosArquivosRaw ?? [],
  );

  const { data: arquivosRaw } = await supabase
    .from("divulgacao_files")
    .select("id, nome_arquivo, arquivo_path, created_at, updated_at")
    .eq("category_id", categoryId)
    .order("nome_arquivo");

  const arquivos = (arquivosRaw ?? []).map((a) => {
    const { data } = supabase.storage.from("divulgacao").getPublicUrl(a.arquivo_path);
    const { data: download } = supabase.storage
      .from("divulgacao")
      .getPublicUrl(a.arquivo_path, { download: a.nome_arquivo });
    return { ...a, url: data.publicUrl, urlDownload: download.publicUrl };
  });

  const { data: outrasCategorias } = ehAdmin
    ? await supabase
        .from("divulgacao_categories")
        .select("id, nome")
        .neq("id", categoryId)
        .order("nome")
    : { data: null };

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1 text-sm text-slate-500">
              <Link href="/divulgacao" className="underline hover:text-slate-700">
                Divulgação
              </Link>
              {caminho.map((c) => (
                <span key={c.id} className="flex items-center gap-1">
                  <span>/</span>
                  {c.id === categoryId ? (
                    <span className="font-medium text-slate-700">{c.nome}</span>
                  ) : (
                    <Link
                      href={`/divulgacao/categoria/${c.id}`}
                      className="underline hover:text-slate-700"
                    >
                      {c.nome}
                    </Link>
                  )}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{categoria.nome}</h1>
          </div>

          {ehAdmin && (
            <details className="relative">
              <summary className="flex cursor-pointer select-none items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
                <Settings className="h-4 w-4" />
                Gerenciar
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-72 space-y-5 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-slate-800">Renomear pasta</h2>
                  <form action={renomearCategoria} className="flex items-end gap-2">
                    <input type="hidden" name="categoryId" value={categoryId} />
                    <input
                      name="nome"
                      defaultValue={categoria.nome}
                      required
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Salvar
                    </button>
                  </form>
                </div>

                <div>
                  <h2 className="mb-2 text-sm font-semibold text-slate-800">Nova subpasta</h2>
                  <form action={criarCategoria} className="flex items-end gap-2">
                    <input type="hidden" name="parentId" value={categoryId} />
                    <input
                      name="nome"
                      placeholder="Ex: Junho/2026"
                      required
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Criar
                    </button>
                  </form>
                </div>
              </div>
            </details>
          )}
        </div>

        {subpastas.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Pastas
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {subpastas.map((sub) => (
                <div
                  key={sub.id}
                  className="group relative rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
                >
                  <Link href={`/divulgacao/categoria/${sub.id}`} className="block">
                    <Folder className="h-9 w-9 fill-indigo-100 text-indigo-600" strokeWidth={1.5} />
                    <p className="mt-3 text-sm font-bold uppercase text-slate-800 group-hover:underline">
                      {sub.nome}
                    </p>
                    <p className="text-sm font-medium text-amber-700">
                      {contagemPorSubpasta.get(sub.id) ?? 0} material(is)
                    </p>
                  </Link>
                  {ehAdmin && (
                    <form action={removerCategoria} className="absolute right-3 top-3">
                      <input type="hidden" name="categoryId" value={sub.id} />
                      <input type="hidden" name="parentId" value={categoryId} />
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
          </div>
        )}

        {ehAdmin && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Enviar material</h2>
            <UploadDiretoForm
              bucket="divulgacao"
              categoryId={categoryId}
              accept="image/jpeg,image/png,application/pdf"
              ajudaTexto="Pode selecionar vários arquivos de uma vez (imagens ou PDF)."
              acaoConcluir={registrarArquivosEnviados.bind(null, categoryId)}
            />
          </div>
        )}

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Materiais nesta pasta
          </h2>
          {arquivos.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-6 shadow">
              <p className="text-sm text-slate-500">Nenhum material aqui ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {arquivos.map((a) => (
                <div key={a.id} className="rounded-2xl bg-white p-5 text-center shadow">
                  {ehImagem(a.nome_arquivo) ? (
                    <img
                      src={a.url}
                      alt={a.nome_arquivo}
                      className="mx-auto h-24 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <FileText className="mx-auto h-10 w-10 text-red-500" strokeWidth={1.5} />
                  )}
                  <p
                    className="mt-3 truncate text-sm font-medium text-slate-800"
                    title={a.nome_arquivo}
                  >
                    {a.nome_arquivo}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </p>

                  <div className="mt-3 flex items-center justify-center gap-3">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                    >
                      Abrir
                    </a>
                    <a
                      href={a.urlDownload}
                      className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                    >
                      Baixar
                    </a>
                  </div>

                  {ehAdmin && (
                    <details className="relative mt-3 border-t border-slate-100 pt-3">
                      <summary className="flex cursor-pointer select-none items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
                        <Settings className="h-3.5 w-3.5" />
                        Gerenciar material
                      </summary>
                      <div className="absolute left-1/2 z-10 mt-2 w-60 -translate-x-1/2 space-y-3 rounded-2xl bg-white p-4 text-left shadow-lg ring-1 ring-slate-200">
                        <SubstituirDiretoForm
                          bucket="divulgacao"
                          categoryId={categoryId}
                          accept="image/jpeg,image/png,application/pdf"
                          acaoConcluir={registrarSubstituicaoArquivo.bind(null, {
                            fileId: a.id,
                            categoryId,
                            arquivoPathAntigo: a.arquivo_path,
                          })}
                        />

                        {outrasCategorias && outrasCategorias.length > 0 && (
                          <form action={moverArquivo} className="space-y-1">
                            <input type="hidden" name="fileId" value={a.id} />
                            <input type="hidden" name="categoryId" value={categoryId} />
                            <select
                              name="novaCategoriaId"
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                            >
                              {outrasCategorias.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.nome}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Mover
                            </button>
                          </form>
                        )}

                        <form action={removerArquivo}>
                          <input type="hidden" name="fileId" value={a.id} />
                          <input type="hidden" name="categoryId" value={categoryId} />
                          <input type="hidden" name="arquivoPath" value={a.arquivo_path} />
                          <button
                            type="submit"
                            className="w-full text-xs font-medium text-red-600 underline"
                          >
                            Remover
                          </button>
                        </form>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
