import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { marcarAreaVisitada } from "@/lib/novidades";

const ROTULO_STATUS: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

export default async function MeusTreinamentosPage() {
  const { supabase, user } = await exigirUsuario();

  await marcarAreaVisitada(supabase, user.id, "treinamentos");

  const { data: matriculasRaw } = await supabase
    .from("enrollments")
    .select("id, status, prazo, course:courses(id, titulo, descricao, area:areas(nome))")
    .eq("user_id", user.id)
    .order("atribuido_em", { ascending: false });

  // Cada matrícula pertence a um único curso, que pertence a uma única pasta;
  // ajustamos o tipo pois não geramos os tipos do banco (isso exigiria a
  // senha do banco de dados).
  const matriculas = (matriculasRaw ?? []) as unknown as Array<{
    id: string;
    status: string;
    prazo: string | null;
    course: {
      id: string;
      titulo: string;
      descricao: string | null;
      area: { nome: string } | null;
    } | null;
  }>;

  const matriculasPorArea = new Map<string, typeof matriculas>();
  for (const m of matriculas) {
    const area = m.course?.area?.nome || "Sem pasta definida";
    matriculasPorArea.set(area, [...(matriculasPorArea.get(area) ?? []), m]);
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Meus treinamentos</h1>
        </div>

        {matriculas.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
            Você ainda não tem treinamentos atribuídos.
          </div>
        ) : (
          <div className="space-y-8">
            {[...matriculasPorArea.entries()].map(([area, matriculasDaArea]) => (
              <div key={area}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {area}
                </h2>
                <ul className="space-y-3">
                  {matriculasDaArea.map((m) => (
                    <li key={m.id} className="rounded-2xl bg-white p-5 shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{m.course?.titulo}</p>
                          {m.course?.descricao && (
                            <p className="text-sm text-slate-500">{m.course.descricao}</p>
                          )}
                          <p className="mt-1 text-sm text-slate-500">
                            Status: <span className="font-medium">{ROTULO_STATUS[m.status]}</span>
                            {m.prazo && (
                              <> · Prazo: {new Date(m.prazo).toLocaleDateString("pt-BR")}</>
                            )}
                          </p>
                        </div>
                        <Link
                          href={`/treinamento/${m.course?.id}`}
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                        >
                          Acessar
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
