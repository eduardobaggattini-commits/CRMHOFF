import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { podeAcompanharEquipe } from "@/lib/perfis";
import { criarCurso } from "./actions";

export default async function PastaTreinamentosPage({
  params,
  searchParams,
}: {
  params: Promise<{ areaId: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { areaId } = await params;
  const { erro } = await searchParams;
  const { supabase, perfil } = await exigirUsuario();

  if (!podeAcompanharEquipe(perfil?.role)) {
    redirect("/");
  }

  const ehAdmin = perfil?.role === "admin";
  const semPasta = areaId === "sem-pasta";

  let nomeArea = "Sem pasta";
  if (!semPasta) {
    const { data: area } = await supabase
      .from("areas")
      .select("nome")
      .eq("id", areaId)
      .single();

    if (!area) {
      return (
        <main className="px-6 py-10">
          <div className="mx-auto max-w-3xl">
            <p className="text-slate-600">Pasta não encontrada.</p>
            <Link href="/admin/treinamentos" className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700">
              Voltar
            </Link>
          </div>
        </main>
      );
    }
    nomeArea = area.nome;
  }

  const consultaBase = supabase
    .from("courses")
    .select("id, titulo, obrigatorio, created_at, enrollments(count)")
    .order("created_at", { ascending: false });

  const { data: cursosRaw } = semPasta
    ? await consultaBase.is("area_id", null)
    : await consultaBase.eq("area_id", areaId);

  const cursos = cursosRaw ?? [];

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">{nomeArea}</h1>
          <Link href="/admin/treinamentos" className="text-sm font-medium text-slate-600 underline">
            Voltar às pastas
          </Link>
        </div>

        {ehAdmin && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Criar novo treinamento</h2>

            {erro && (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
            )}

            <form action={criarCurso} className="space-y-4">
              <input type="hidden" name="area_id" value={semPasta ? "" : areaId} />
              <div>
                <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-slate-700">
                  Título
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="descricao" className="mb-1 block text-sm font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="obrigatorio" className="h-4 w-4" />
                Obrigatório para todos (matricula todos automaticamente)
              </label>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Criar e montar conteúdo
              </button>
            </form>
          </div>
        )}

        <div className="rounded-2xl bg-white shadow">
          <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-800">
            Treinamentos nesta pasta
          </h2>
          {cursos.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">Nenhum treinamento aqui ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cursos.map((curso) => (
                <li key={curso.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-800">{curso.titulo}</p>
                    <p className="text-sm text-slate-500">
                      {curso.obrigatorio ? "Obrigatório para todos" : "Atribuição manual"} ·{" "}
                      {curso.enrollments[0]?.count ?? 0} matriculado(s)
                    </p>
                  </div>
                  <Link
                    href={
                      ehAdmin
                        ? `/admin/treinamentos/${curso.id}/editar`
                        : `/admin/treinamentos/${curso.id}/progresso`
                    }
                    className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                  >
                    {ehAdmin ? "Editar" : "Ver progresso"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
