import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { podeAcompanharEquipe } from "@/lib/perfis";
import { marcarAreaVisitada } from "@/lib/novidades";
import { criarArea, removerArea } from "./actions";

export default async function AdminTreinamentosPage() {
  const { supabase, user, perfil } = await exigirUsuario();

  if (!podeAcompanharEquipe(perfil?.role)) {
    redirect("/");
  }

  const ehAdmin = perfil?.role === "admin";

  await marcarAreaVisitada(supabase, user.id, "treinamentos");

  const { data: areasRaw } = await supabase.from("areas").select("id, nome").order("nome");
  const areas = areasRaw ?? [];

  const { data: cursosRaw } = await supabase.from("courses").select("id, area_id");
  const cursos = cursosRaw ?? [];

  const contagemPorArea = new Map<string, number>();
  let semPasta = 0;
  for (const curso of cursos) {
    if (curso.area_id) {
      contagemPorArea.set(curso.area_id, (contagemPorArea.get(curso.area_id) ?? 0) + 1);
    } else {
      semPasta += 1;
    }
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Treinamentos</h1>
        </div>

        {ehAdmin && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Nova pasta</h2>
            <form action={criarArea} className="flex items-end gap-2">
              <input
                name="nome"
                placeholder="Nome da pasta (ex: Comercial, Segurança do Trabalho)"
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

        {areas.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-6 shadow">
            <p className="text-sm text-slate-500">Nenhuma pasta criada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className="group relative rounded-2xl bg-white p-5 shadow transition hover:shadow-md"
              >
                <Link href={`/admin/treinamentos/pastas/${area.id}`} className="block">
                  <Folder className="h-9 w-9 fill-indigo-100 text-indigo-600" strokeWidth={1.5} />
                  <p className="mt-3 text-sm font-bold uppercase text-slate-800 group-hover:underline">
                    {area.nome}
                  </p>
                  <p className="text-sm font-medium text-amber-700">
                    {contagemPorArea.get(area.id) ?? 0} treinamento(s)
                  </p>
                </Link>
                {ehAdmin && (
                  <form action={removerArea} className="absolute right-3 top-3">
                    <input type="hidden" name="areaId" value={area.id} />
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

        {semPasta > 0 && (
          <div className="mt-4">
            <Link
              href="/admin/treinamentos/pastas/sem-pasta"
              className="text-sm font-medium text-slate-600 underline"
            >
              Ver {semPasta} treinamento(s) sem pasta
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
