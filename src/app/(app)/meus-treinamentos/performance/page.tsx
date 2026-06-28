import { exigirUsuario } from "@/lib/auth";

export default async function PerformancePage() {
  const { supabase, user, perfil } = await exigirUsuario();

  const { data: matriculasRaw } = await supabase
    .from("enrollments")
    .select("id, status, course:courses(id, titulo)")
    .eq("user_id", user.id);

  const matriculas = (matriculasRaw ?? []) as unknown as Array<{
    id: string;
    status: string;
    course: { id: string; titulo: string } | null;
  }>;

  const progresso = await Promise.all(
    matriculas.map(async (m) => {
      if (!m.course) return { ...m, totalAulas: 0, aulasConcluidas: 0 };

      const { data: aulasDoCurso } = await supabase
        .from("lessons")
        .select("id, modules!inner(course_id)")
        .eq("modules.course_id", m.course.id);

      const idsAulas = (aulasDoCurso ?? []).map((a) => a.id);

      const { count: aulasConcluidas } = await supabase
        .from("lesson_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("concluido", true)
        .in("lesson_id", idsAulas.length > 0 ? idsAulas : [""]);

      return { ...m, totalAulas: idsAulas.length, aulasConcluidas: aulasConcluidas ?? 0 };
    }),
  );

  const concluidos = matriculas.filter((m) => m.status === "concluido").length;
  const emAndamento = matriculas.filter((m) => m.status === "em_andamento").length;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Performance</h1>

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-bold text-indigo-600">{perfil?.pontos ?? 0}</p>
            <p className="text-sm text-slate-500">Pontos</p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-bold text-indigo-600">{concluidos}</p>
            <p className="text-sm text-slate-500">Concluídos</p>
          </div>
          <div className="rounded-2xl bg-white p-5 text-center shadow">
            <p className="text-3xl font-bold text-indigo-600">{emAndamento}</p>
            <p className="text-sm text-slate-500">Em andamento</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow">
          <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-800">
            Progresso por treinamento
          </h2>
          {progresso.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">
              Você ainda não tem treinamentos atribuídos.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {progresso.map((p) => {
                const percentual =
                  p.totalAulas > 0 ? Math.round((p.aulasConcluidas / p.totalAulas) * 100) : 0;
                return (
                  <li key={p.id} className="px-6 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-medium text-slate-800">{p.course?.titulo}</p>
                      <p className="text-sm text-slate-500">{percentual}%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-600"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
