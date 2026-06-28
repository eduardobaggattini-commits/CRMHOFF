import Link from "next/link";
import { redirect } from "next/navigation";
import { exigirUsuario } from "@/lib/auth";
import { podeAcompanharEquipe } from "@/lib/perfis";

export default async function ProgressoCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = await params;
  const { supabase, perfil } = await exigirUsuario();

  if (!podeAcompanharEquipe(perfil?.role)) {
    redirect("/");
  }

  const { data: curso } = await supabase
    .from("courses")
    .select("id, titulo")
    .eq("id", courseId)
    .single();

  const { data: matriculasRaw } = await supabase
    .from("enrollments")
    .select("user_id, status, profiles(id, nome, email)")
    .eq("course_id", courseId);

  // Cada matrícula pertence a uma única pessoa; ajustamos o tipo pois não
  // geramos os tipos do banco (isso exigiria a senha do banco de dados).
  const matriculas = (matriculasRaw ?? []) as unknown as Array<{
    user_id: string;
    status: string;
    profiles: { id: string; nome: string; email: string } | null;
  }>;

  const { data: aulasDoCurso } = await supabase
    .from("lessons")
    .select("id, modules!inner(course_id)")
    .eq("modules.course_id", courseId);

  const idsAulas = (aulasDoCurso ?? []).map((a) => a.id);

  const { data: progressoRaw } =
    idsAulas.length > 0
      ? await supabase
          .from("lesson_progress")
          .select("user_id, lesson_id, concluido, acertos, total_perguntas")
          .in("lesson_id", idsAulas)
      : { data: [] };

  const progresso = progressoRaw ?? [];

  if (!curso) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-600">Treinamento não encontrado.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Progresso — {curso.titulo}</h1>
          <Link
            href={perfil?.role === "admin" ? `/admin/treinamentos/${courseId}/editar` : "/"}
            className="text-sm font-medium text-slate-600 underline"
          >
            Voltar
          </Link>
        </div>

        <div className="rounded-2xl bg-white shadow">
          {matriculas.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">Ninguém matriculado ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {matriculas.map((m) => {
                const progressoDaPessoa = progresso.filter((p) => p.user_id === m.user_id);
                const aulasConcluidas = progressoDaPessoa.filter((p) => p.concluido).length;

                const comNota = progressoDaPessoa.filter((p) => p.total_perguntas != null);
                const mediaTexto =
                  comNota.length > 0
                    ? (
                        comNota.reduce((soma, p) => soma + (p.acertos ?? 0), 0) / comNota.length
                      ).toFixed(1) +
                      "/" +
                      (
                        comNota.reduce((soma, p) => soma + (p.total_perguntas ?? 0), 0) /
                        comNota.length
                      ).toFixed(1)
                    : null;

                return (
                  <li key={m.user_id} className="px-6 py-4">
                    <p className="font-medium text-slate-800">
                      {m.profiles?.nome} ({m.profiles?.email})
                    </p>
                    <p className="text-sm text-slate-500">
                      {aulasConcluidas} de {idsAulas.length} aula(s) concluída(s)
                      {mediaTexto && <> · Média de acertos: {mediaTexto}</>}
                    </p>
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
