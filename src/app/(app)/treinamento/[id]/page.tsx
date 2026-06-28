import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { paraEmbedUrl, ehLinkExterno } from "@/lib/video";
import { concluirAula, responderQuestionario } from "./actions";

const ROTULO_STATUS: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
};

function ProgressoCircular({ percentual }: { percentual: number }) {
  const raio = 28;
  const circunferencia = 2 * Math.PI * raio;
  const offset = circunferencia - (percentual / 100) * circunferencia;

  return (
    <div className="relative h-16 w-16">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={raio} stroke="#e2e8f0" strokeWidth="6" fill="none" />
        <circle
          cx="32"
          cy="32"
          r={raio}
          stroke="#4f46e5"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
        {percentual}%
      </span>
    </div>
  );
}

export default async function TreinamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aula?: string }>;
}) {
  const { id: courseId } = await params;
  const { aula: aulaSelecionadaId } = await searchParams;
  const { supabase, user } = await exigirUsuario();

  const { data: curso } = await supabase
    .from("courses")
    .select("id, titulo")
    .eq("id", courseId)
    .single();

  const { data: modulos } = await supabase
    .from("modules")
    .select(
      "id, titulo, ordem, lessons(id, titulo, tipo, conteudo_url, ordem, acertos_minimos, lesson_questions(id, enunciado, ordem, lesson_question_options(id, texto, ordem)))",
    )
    .eq("course_id", courseId)
    .order("ordem");

  const { data: progressoTodas } = await supabase
    .from("lesson_progress")
    .select("lesson_id, concluido, acertos, total_perguntas")
    .eq("user_id", user.id);

  const idsConcluidas = new Set(
    (progressoTodas ?? []).filter((p) => p.concluido).map((p) => p.lesson_id),
  );
  const progressoPorAula = new Map((progressoTodas ?? []).map((p) => [p.lesson_id, p]));

  const { data: matricula } = await supabase
    .from("enrollments")
    .select("status")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!curso || !modulos) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-600">Treinamento não encontrado ou sem acesso.</p>
          <Link href="/meus-treinamentos" className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700">
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  const todasAulas = modulos
    .flatMap((m) => m.lessons)
    .sort((a, b) => a.ordem - b.ordem);

  const aulaAtual =
    todasAulas.find((a) => a.id === aulaSelecionadaId) ??
    todasAulas.find((a) => !idsConcluidas.has(a.id)) ??
    todasAulas[0];

  const percentual =
    todasAulas.length > 0
      ? Math.round((idsConcluidas.size / todasAulas.length) * 100)
      : 0;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{curso.titulo}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow">
            {!aulaAtual ? (
              <p className="text-sm text-slate-500">
                Esse treinamento ainda não tem aulas cadastradas.
              </p>
            ) : (
              <>
                <h2 className="mb-3 text-lg font-semibold text-slate-800">
                  {aulaAtual.titulo}
                </h2>

                {!aulaAtual.conteudo_url ? (
                  <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Essa aula ainda não tem vídeo ou arquivo configurado.
                  </p>
                ) : aulaAtual.tipo === "documento" ? (
                  <div>
                    <iframe
                      src={aulaAtual.conteudo_url ?? ""}
                      className="h-[600px] w-full rounded-lg border border-slate-200"
                    />
                    <a
                      href={aulaAtual.conteudo_url ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-slate-600 underline"
                    >
                      Abrir/baixar arquivo em outra aba
                    </a>
                  </div>
                ) : ehLinkExterno(aulaAtual.conteudo_url ?? "") ? (
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                    <iframe
                      src={paraEmbedUrl(aulaAtual.conteudo_url ?? "")}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video
                    src={aulaAtual.conteudo_url ?? ""}
                    controls
                    className="aspect-video w-full rounded-lg bg-slate-900"
                  />
                )}

                {aulaAtual.lesson_questions && aulaAtual.lesson_questions.length > 0 ? (
                  (() => {
                    const perguntas = [...aulaAtual.lesson_questions].sort(
                      (a, b) => a.ordem - b.ordem,
                    );
                    const resultado = progressoPorAula.get(aulaAtual.id);
                    const concluida = idsConcluidas.has(aulaAtual.id);

                    return (
                      <div className="mt-6 border-t border-slate-100 pt-4">
                        <h3 className="mb-3 text-base font-semibold text-slate-800">
                          Questionário ({perguntas.length}{" "}
                          {perguntas.length === 1 ? "pergunta" : "perguntas"})
                        </h3>

                        {resultado && resultado.total_perguntas != null && (
                          <p
                            className={`mb-3 rounded-md px-3 py-2 text-sm font-medium ${
                              concluida
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {concluida
                              ? `Aula concluída! Você acertou ${resultado.acertos} de ${resultado.total_perguntas}.`
                              : `Você acertou ${resultado.acertos} de ${resultado.total_perguntas}. ${
                                  aulaAtual.acertos_minimos
                                    ? `Precisa de pelo menos ${aulaAtual.acertos_minimos} para concluir — tente de novo.`
                                    : ""
                                }`}
                          </p>
                        )}

                        <form action={responderQuestionario} className="space-y-4">
                          <input type="hidden" name="lessonId" value={aulaAtual.id} />
                          <input type="hidden" name="courseId" value={courseId} />
                          {perguntas.map((pergunta, indice) => (
                            <div key={pergunta.id}>
                              <p className="mb-1 text-sm font-medium text-slate-700">
                                {indice + 1}. {pergunta.enunciado}
                              </p>
                              <div className="space-y-1">
                                {[...pergunta.lesson_question_options]
                                  .sort((a, b) => a.ordem - b.ordem)
                                  .map((opcao) => (
                                    <label
                                      key={opcao.id}
                                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                                    >
                                      <input
                                        type="radio"
                                        name={`resposta_${pergunta.id}`}
                                        value={opcao.id}
                                        required
                                        className="h-4 w-4"
                                      />
                                      {opcao.texto}
                                    </label>
                                  ))}
                              </div>
                            </div>
                          ))}
                          <button
                            type="submit"
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                          >
                            {resultado ? "Responder de novo" : "Responder questionário"}
                          </button>
                        </form>
                      </div>
                    );
                  })()
                ) : (
                  <form action={concluirAula} className="mt-4">
                    <input type="hidden" name="lessonId" value={aulaAtual.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <button
                      type="submit"
                      disabled={idsConcluidas.has(aulaAtual.id)}
                      className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {idsConcluidas.has(aulaAtual.id) ? "Aula concluída" : "Marcar como concluída"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <h2 className="text-center text-base font-bold text-slate-800">{curso.titulo}</h2>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
              <div>
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-semibold text-slate-800">
                  {ROTULO_STATUS[matricula?.status ?? "nao_iniciado"]}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-xs text-slate-500">Progresso</p>
                <ProgressoCircular percentual={percentual} />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {modulos.map((modulo) => (
                <div key={modulo.id}>
                  <p className="mb-1 px-1 text-xs font-semibold uppercase text-slate-400">
                    {modulo.titulo}
                  </p>
                  <ul className="space-y-1.5">
                    {modulo.lessons
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((aula) => {
                        const concluida = idsConcluidas.has(aula.id);
                        const ativa = aula.id === aulaAtual?.id;
                        return (
                          <li key={aula.id}>
                            <Link
                              href={`/treinamento/${courseId}?aula=${aula.id}`}
                              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                ativa
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {concluida ? (
                                <CheckCircle2
                                  className={`h-4 w-4 flex-shrink-0 ${ativa ? "text-white" : "text-emerald-500"}`}
                                />
                              ) : (
                                <Circle
                                  className={`h-4 w-4 flex-shrink-0 ${ativa ? "text-white" : "text-slate-300"}`}
                                />
                              )}
                              <span className="truncate">{aula.titulo}</span>
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
