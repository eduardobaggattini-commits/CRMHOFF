"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";

const TAMANHO_MAXIMO_ARQUIVO = 50 * 1024 * 1024;

export async function definirArea(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const courseId = formData.get("courseId") as string;
  const areaId = formData.get("area_id") as string;

  await supabase
    .from("courses")
    .update({ area_id: areaId || null })
    .eq("id", courseId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function criarModulo(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const courseId = formData.get("courseId") as string;
  const titulo = formData.get("titulo") as string;

  const { count } = await supabase
    .from("modules")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId);

  await supabase
    .from("modules")
    .insert({ course_id: courseId, titulo, ordem: count ?? 0 });

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function removerModulo(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const moduleId = formData.get("moduleId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase.from("modules").delete().eq("id", moduleId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function criarAula(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const moduleId = formData.get("moduleId") as string;
  const courseId = formData.get("courseId") as string;
  const titulo = formData.get("titulo") as string;
  const linkVideo = (formData.get("conteudo_url") as string) || "";
  const arquivo = formData.get("arquivo") as File | null;

  let conteudoUrl = linkVideo;
  let tipo: "video" | "documento" = "video";

  if (arquivo && arquivo.size > 0) {
    if (arquivo.size > TAMANHO_MAXIMO_ARQUIVO) {
      redirect(
        `/admin/treinamentos/${courseId}/editar?erro=${encodeURIComponent(
          `Esse arquivo tem ${(arquivo.size / 1024 / 1024).toFixed(1)}MB, e o limite é 50MB. Comprima o vídeo ou use um link do YouTube/Vimeo.`,
        )}`,
      );
    }

    const extensao = arquivo.name.split(".").pop();
    const caminho = `${moduleId}/${crypto.randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("materiais")
      .upload(caminho, arquivo);

    if (erroUpload) {
      redirect(
        `/admin/treinamentos/${courseId}/editar?erro=${encodeURIComponent(
          `Não foi possível enviar o arquivo: ${erroUpload.message}`,
        )}`,
      );
    }

    const { data: urlPublica } = supabase.storage.from("materiais").getPublicUrl(caminho);
    conteudoUrl = urlPublica.publicUrl;
    tipo = arquivo.type.startsWith("video/") ? "video" : "documento";
  }

  const { count } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("module_id", moduleId);

  await supabase.from("lessons").insert({
    module_id: moduleId,
    titulo,
    tipo,
    conteudo_url: conteudoUrl,
    ordem: count ?? 0,
  });

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function editarAula(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const lessonId = formData.get("lessonId") as string;
  const courseId = formData.get("courseId") as string;
  const titulo = formData.get("titulo") as string;
  const conteudoUrl = (formData.get("conteudo_url") as string) || "";

  await supabase
    .from("lessons")
    .update({ titulo, conteudo_url: conteudoUrl })
    .eq("id", lessonId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function removerAula(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const lessonId = formData.get("lessonId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase.from("lessons").delete().eq("id", lessonId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function atribuirPessoas(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const courseId = formData.get("courseId") as string;
  const prazo = formData.get("prazo") as string;
  const pessoaIds = formData.getAll("pessoaIds") as string[];

  if (pessoaIds.length > 0) {
    await supabase.from("enrollments").upsert(
      pessoaIds.map((id) => ({
        user_id: id,
        course_id: courseId,
        prazo: prazo || null,
      })),
      { onConflict: "user_id,course_id", ignoreDuplicates: true },
    );
  }

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function removerMatricula(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const enrollmentId = formData.get("enrollmentId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase.from("enrollments").delete().eq("id", enrollmentId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

const MAXIMO_PERGUNTAS_POR_AULA = 5;

export async function definirNotaMinima(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const lessonId = formData.get("lessonId") as string;
  const courseId = formData.get("courseId") as string;
  const valor = (formData.get("acertosMinimos") as string) || "";

  await supabase
    .from("lessons")
    .update({ acertos_minimos: valor ? Number(valor) : null })
    .eq("id", lessonId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function criarPergunta(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const lessonId = formData.get("lessonId") as string;
  const courseId = formData.get("courseId") as string;
  const enunciado = formData.get("enunciado") as string;

  const { count } = await supabase
    .from("lesson_questions")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", lessonId);

  if ((count ?? 0) >= MAXIMO_PERGUNTAS_POR_AULA) {
    redirect(
      `/admin/treinamentos/${courseId}/editar?erro=${encodeURIComponent(
        `Cada aula pode ter no máximo ${MAXIMO_PERGUNTAS_POR_AULA} perguntas.`,
      )}`,
    );
  }

  await supabase.from("lesson_questions").insert({
    lesson_id: lessonId,
    enunciado,
    ordem: count ?? 0,
  });

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function removerPergunta(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const questionId = formData.get("questionId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase.from("lesson_questions").delete().eq("id", questionId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function criarAlternativa(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const questionId = formData.get("questionId") as string;
  const courseId = formData.get("courseId") as string;
  const texto = formData.get("texto") as string;

  const { count } = await supabase
    .from("lesson_question_options")
    .select("id", { count: "exact", head: true })
    .eq("question_id", questionId);

  await supabase.from("lesson_question_options").insert({
    question_id: questionId,
    texto,
    ordem: count ?? 0,
  });

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function removerAlternativa(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const optionId = formData.get("optionId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase.from("lesson_question_options").delete().eq("id", optionId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}

export async function marcarCorreta(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const optionId = formData.get("optionId") as string;
  const questionId = formData.get("questionId") as string;
  const courseId = formData.get("courseId") as string;

  await supabase
    .from("lesson_question_options")
    .update({ correta: false })
    .eq("question_id", questionId);

  await supabase.from("lesson_question_options").update({ correta: true }).eq("id", optionId);

  revalidatePath(`/admin/treinamentos/${courseId}/editar`);
}
