import Link from "next/link";
import { Settings, Pencil } from "lucide-react";
import { exigirAdmin } from "@/lib/auth";
import {
  definirArea,
  criarModulo,
  removerModulo,
  criarAula,
  editarAula,
  removerAula,
  atribuirPessoas,
  removerMatricula,
  definirNotaMinima,
  criarPergunta,
  removerPergunta,
  criarAlternativa,
  removerAlternativa,
  marcarCorreta,
} from "./actions";

export default async function EditarTreinamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id: courseId } = await params;
  const { erro } = await searchParams;
  const { supabase } = await exigirAdmin();

  const { data: curso } = await supabase
    .from("courses")
    .select("id, titulo, descricao, obrigatorio, area_id")
    .eq("id", courseId)
    .single();

  const { data: areas } = await supabase.from("areas").select("id, nome").order("nome");

  const { data: modulos } = await supabase
    .from("modules")
    .select(
      "id, titulo, ordem, lessons(id, titulo, conteudo_url, ordem, acertos_minimos, lesson_questions(id, enunciado, ordem, lesson_question_options(id, texto, correta, ordem)))",
    )
    .eq("course_id", courseId)
    .order("ordem");

  const { data: matriculasRaw } = await supabase
    .from("enrollments")
    .select("id, prazo, profiles(id, nome, email)")
    .eq("course_id", courseId);

  // PostgREST devolve "profiles" como objeto único (matrícula pertence a uma só pessoa),
  // mas sem os tipos gerados do banco o TypeScript não sabe disso — então ajustamos aqui.
  const matriculas = (matriculasRaw ?? []) as unknown as Array<{
    id: string;
    prazo: string | null;
    profiles: { id: string; nome: string; email: string } | null;
  }>;

  const idsMatriculados = new Set(matriculas.map((m) => m.profiles?.id));

  const { data: pessoas } = await supabase
    .from("profiles")
    .select("id, nome, email")
    .in("role", ["vendedor", "supervisor", "gerente_comercial"])
    .order("nome");

  const pessoasDisponiveis = (pessoas ?? []).filter((p) => !idsMatriculados.has(p.id));

  if (!curso) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-600">Treinamento não encontrado.</p>
          <Link href="/admin/treinamentos" className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700">
            Voltar ao catálogo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{curso.titulo}</h1>
            {curso.descricao && <p className="text-sm text-slate-500">{curso.descricao}</p>}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/treinamentos/${courseId}/progresso`}
              className="text-sm font-medium text-slate-600 underline"
            >
              Ver progresso
            </Link>
            <Link href="/admin/treinamentos" className="text-sm font-medium text-slate-600 underline">
              Voltar ao catálogo
            </Link>
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Pasta (área)</h2>
          {!areas || areas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhuma pasta criada ainda. Volte ao catálogo para criar uma.
            </p>
          ) : (
            <form action={definirArea} className="flex items-end gap-2">
              <input type="hidden" name="courseId" value={courseId} />
              <select
                name="area_id"
                defaultValue={curso.area_id ?? ""}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Sem pasta</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.nome}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Salvar
              </button>
            </form>
          )}
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Módulos e aulas</h2>

          {erro && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
          )}

          <div className="space-y-6">
            {(modulos ?? []).map((modulo) => (
              <div key={modulo.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">{modulo.titulo}</h3>
                  <form action={removerModulo}>
                    <input type="hidden" name="moduleId" value={modulo.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <button type="submit" className="text-xs font-medium text-red-600 underline">
                      Remover módulo
                    </button>
                  </form>
                </div>

                <ul className="mb-4 space-y-2">
                  {modulo.lessons
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((aula) => {
                      const perguntas = (aula.lesson_questions ?? []).sort(
                        (a, b) => a.ordem - b.ordem,
                      );
                      return (
                        <li
                          key={aula.id}
                          className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-slate-700">{aula.titulo}</span>
                            <div className="flex items-center gap-3">
                              <details className="relative">
                                <summary className="flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </summary>
                                <div className="absolute right-0 z-10 mt-2 w-72 rounded-2xl bg-white p-4 text-left shadow-lg ring-1 ring-slate-200">
                                  <form action={editarAula} className="space-y-2">
                                    <input type="hidden" name="lessonId" value={aula.id} />
                                    <input type="hidden" name="courseId" value={courseId} />
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Título da aula
                                      </label>
                                      <input
                                        name="titulo"
                                        defaultValue={aula.titulo}
                                        required
                                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-slate-600">
                                        Link do YouTube/Vimeo
                                      </label>
                                      <input
                                        name="conteudo_url"
                                        defaultValue={aula.conteudo_url ?? ""}
                                        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                      />
                                    </div>
                                    <button
                                      type="submit"
                                      className="w-full rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                                    >
                                      Salvar
                                    </button>
                                  </form>
                                </div>
                              </details>

                              <details className="relative">
                                <summary className="flex cursor-pointer select-none items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 [&::-webkit-details-marker]:hidden">
                                  <Settings className="h-3.5 w-3.5" />
                                  Questionário ({perguntas.length})
                                </summary>
                                <div className="absolute right-0 z-10 mt-2 w-80 space-y-4 rounded-2xl bg-white p-4 text-left shadow-lg ring-1 ring-slate-200">
                                  <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">
                                      Nota mínima (nº de acertos para concluir)
                                    </label>
                                    <form
                                      action={definirNotaMinima}
                                      className="flex items-end gap-2"
                                    >
                                      <input type="hidden" name="lessonId" value={aula.id} />
                                      <input type="hidden" name="courseId" value={courseId} />
                                      <input
                                        name="acertosMinimos"
                                        type="number"
                                        min={1}
                                        max={5}
                                        defaultValue={aula.acertos_minimos ?? ""}
                                        placeholder="Sem mínimo"
                                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                      />
                                      <button
                                        type="submit"
                                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                      >
                                        Salvar
                                      </button>
                                    </form>
                                  </div>

                                  <div className="space-y-3 border-t border-slate-100 pt-3">
                                    {perguntas.map((pergunta, indice) => (
                                      <div
                                        key={pergunta.id}
                                        className="rounded-lg border border-slate-200 p-2"
                                      >
                                        <div className="mb-1 flex items-center justify-between">
                                          <p className="text-xs font-semibold text-slate-700">
                                            {indice + 1}. {pergunta.enunciado}
                                          </p>
                                          <form action={removerPergunta}>
                                            <input
                                              type="hidden"
                                              name="questionId"
                                              value={pergunta.id}
                                            />
                                            <input
                                              type="hidden"
                                              name="courseId"
                                              value={courseId}
                                            />
                                            <button
                                              type="submit"
                                              className="text-xs text-red-600 underline"
                                            >
                                              Remover
                                            </button>
                                          </form>
                                        </div>
                                        <ul className="space-y-1">
                                          {(pergunta.lesson_question_options ?? [])
                                            .sort((a, b) => a.ordem - b.ordem)
                                            .map((opcao) => (
                                              <li
                                                key={opcao.id}
                                                className="flex items-center gap-2"
                                              >
                                                <form action={marcarCorreta}>
                                                  <input
                                                    type="hidden"
                                                    name="optionId"
                                                    value={opcao.id}
                                                  />
                                                  <input
                                                    type="hidden"
                                                    name="questionId"
                                                    value={pergunta.id}
                                                  />
                                                  <input
                                                    type="hidden"
                                                    name="courseId"
                                                    value={courseId}
                                                  />
                                                  <button
                                                    type="submit"
                                                    title="Marcar como correta"
                                                    className={`text-xs ${
                                                      opcao.correta
                                                        ? "text-emerald-600"
                                                        : "text-slate-300 hover:text-slate-500"
                                                    }`}
                                                  >
                                                    ●
                                                  </button>
                                                </form>
                                                <span className="flex-1 text-xs text-slate-600">
                                                  {opcao.texto}
                                                </span>
                                                <form action={removerAlternativa}>
                                                  <input
                                                    type="hidden"
                                                    name="optionId"
                                                    value={opcao.id}
                                                  />
                                                  <input
                                                    type="hidden"
                                                    name="courseId"
                                                    value={courseId}
                                                  />
                                                  <button
                                                    type="submit"
                                                    className="text-xs text-red-600 underline"
                                                  >
                                                    x
                                                  </button>
                                                </form>
                                              </li>
                                            ))}
                                        </ul>
                                        <form
                                          action={criarAlternativa}
                                          className="mt-1 flex items-end gap-1"
                                        >
                                          <input
                                            type="hidden"
                                            name="questionId"
                                            value={pergunta.id}
                                          />
                                          <input
                                            type="hidden"
                                            name="courseId"
                                            value={courseId}
                                          />
                                          <input
                                            name="texto"
                                            placeholder="Nova alternativa"
                                            required
                                            className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                          />
                                          <button
                                            type="submit"
                                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                          >
                                            +
                                          </button>
                                        </form>
                                      </div>
                                    ))}
                                  </div>

                                  {perguntas.length < 5 && (
                                    <form
                                      action={criarPergunta}
                                      className="flex items-end gap-1 border-t border-slate-100 pt-3"
                                    >
                                      <input type="hidden" name="lessonId" value={aula.id} />
                                      <input type="hidden" name="courseId" value={courseId} />
                                      <input
                                        name="enunciado"
                                        placeholder="Nova pergunta"
                                        required
                                        className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                      />
                                      <button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                                      >
                                        Adicionar
                                      </button>
                                    </form>
                                  )}
                                </div>
                              </details>

                              <form action={removerAula}>
                                <input type="hidden" name="lessonId" value={aula.id} />
                                <input type="hidden" name="courseId" value={courseId} />
                                <button
                                  type="submit"
                                  className="text-xs font-medium text-red-600 underline"
                                >
                                  Remover
                                </button>
                              </form>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  {modulo.lessons.length === 0 && (
                    <li className="text-sm text-slate-400">Nenhuma aula ainda.</li>
                  )}
                </ul>

                <form action={criarAula} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="moduleId" value={modulo.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <input
                    name="titulo"
                    placeholder="Título da aula"
                    required
                    className="flex-1 basis-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    name="conteudo_url"
                    placeholder="Link do YouTube/Vimeo (ou envie um arquivo ao lado)"
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    name="arquivo"
                    type="file"
                    accept="video/*,application/pdf,.ppt,.pptx"
                    className="flex-1 text-xs text-slate-600"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Adicionar aula
                  </button>
                  <p className="basis-full text-xs text-slate-400">
                    Preencha o link OU escolha um arquivo (vídeo, PDF ou PPT — até 50MB).
                  </p>
                </form>
              </div>
            ))}

            {(!modulos || modulos.length === 0) && (
              <p className="text-sm text-slate-500">Nenhum módulo criado ainda.</p>
            )}
          </div>

          <form action={criarModulo} className="mt-6 flex items-end gap-2 border-t border-slate-100 pt-4">
            <input type="hidden" name="courseId" value={courseId} />
            <input
              name="titulo"
              placeholder="Título do novo módulo"
              required
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Adicionar módulo
            </button>
          </form>
        </div>

        {!curso.obrigatorio && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Quem tem acesso</h2>

            <ul className="mb-4 divide-y divide-slate-100">
              {(matriculas ?? []).map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-700">
                    {m.profiles?.nome} ({m.profiles?.email})
                  </span>
                  <form action={removerMatricula}>
                    <input type="hidden" name="enrollmentId" value={m.id} />
                    <input type="hidden" name="courseId" value={courseId} />
                    <button type="submit" className="text-xs font-medium text-red-600 underline">
                      Remover acesso
                    </button>
                  </form>
                </li>
              ))}
              {(!matriculas || matriculas.length === 0) && (
                <li className="py-2 text-sm text-slate-400">Ninguém tem acesso ainda.</li>
              )}
            </ul>

            {pessoasDisponiveis.length > 0 ? (
              <form action={atribuirPessoas} className="space-y-3 border-t border-slate-100 pt-4">
                <input type="hidden" name="courseId" value={courseId} />
                <p className="text-sm font-medium text-slate-700">Dar acesso a:</p>
                <div className="space-y-1">
                  {pessoasDisponiveis.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" name="pessoaIds" value={p.id} className="h-4 w-4" />
                      {p.nome} ({p.email})
                    </label>
                  ))}
                </div>
                <div>
                  <label htmlFor="prazo" className="mb-1 block text-sm font-medium text-slate-700">
                    Prazo (opcional)
                  </label>
                  <input
                    id="prazo"
                    name="prazo"
                    type="date"
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Dar acesso
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-400">
                Todas as pessoas cadastradas já têm acesso.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
