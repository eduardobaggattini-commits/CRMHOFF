"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

async function atualizarStatusMatricula(
  supabase: SupabaseClient,
  userId: string,
  courseId: string,
) {
  const { data: aulasDoCurso } = await supabase
    .from("lessons")
    .select("id, modules!inner(course_id)")
    .eq("modules.course_id", courseId);

  const idsAulas = (aulasDoCurso ?? []).map((a) => a.id);

  const { count: aulasConcluidas } = await supabase
    .from("lesson_progress")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("concluido", true)
    .in("lesson_id", idsAulas.length > 0 ? idsAulas : [""]);

  const status =
    idsAulas.length > 0 && (aulasConcluidas ?? 0) >= idsAulas.length
      ? "concluido"
      : "em_andamento";

  await supabase
    .from("enrollments")
    .update({ status })
    .eq("user_id", userId)
    .eq("course_id", courseId);
}

export async function concluirAula(formData: FormData) {
  const { supabase, user } = await exigirUsuario();

  const lessonId = formData.get("lessonId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      concluido: true,
      concluido_em: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  await atualizarStatusMatricula(supabase, user.id, courseId);

  revalidatePath(`/treinamento/${courseId}`);
  revalidatePath("/meus-treinamentos");
}

export async function responderQuestionario(formData: FormData) {
  const { supabase, user } = await exigirUsuario();

  const lessonId = formData.get("lessonId") as string;
  const courseId = formData.get("courseId") as string;

  const { data: perguntas } = await supabase
    .from("lesson_questions")
    .select("id, lesson_question_options(id, correta)")
    .eq("lesson_id", lessonId);

  const total = perguntas?.length ?? 0;
  let acertos = 0;

  for (const pergunta of perguntas ?? []) {
    const respostaId = formData.get(`resposta_${pergunta.id}`) as string | null;
    const opcaoCorreta = (pergunta.lesson_question_options ?? []).find((o) => o.correta);
    if (respostaId && opcaoCorreta && respostaId === opcaoCorreta.id) {
      acertos += 1;
    }
  }

  const { data: aula } = await supabase
    .from("lessons")
    .select("acertos_minimos")
    .eq("id", lessonId)
    .single();

  const minimo = aula?.acertos_minimos;
  const passou = minimo == null ? true : acertos >= minimo;

  await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      concluido: passou,
      concluido_em: passou ? new Date().toISOString() : null,
      acertos,
      total_perguntas: total,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (passou) {
    await atualizarStatusMatricula(supabase, user.id, courseId);
  }

  revalidatePath(`/treinamento/${courseId}`);
  revalidatePath("/meus-treinamentos");
}
