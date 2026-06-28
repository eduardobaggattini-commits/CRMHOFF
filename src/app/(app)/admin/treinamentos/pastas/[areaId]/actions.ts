"use server";

import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";

export async function criarCurso(formData: FormData) {
  const { supabase, user } = await exigirAdmin();

  const titulo = formData.get("titulo") as string;
  const descricao = formData.get("descricao") as string;
  const areaId = formData.get("area_id") as string;
  const obrigatorio = formData.get("obrigatorio") === "on";

  const { data: curso, error } = await supabase
    .from("courses")
    .insert({
      titulo,
      descricao,
      area_id: areaId || null,
      obrigatorio,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !curso) {
    redirect(
      `/admin/treinamentos/pastas/${areaId || "sem-pasta"}?erro=${encodeURIComponent(
        error?.message ?? "Erro ao criar treinamento.",
      )}`,
    );
  }

  if (obrigatorio) {
    const { data: pessoas } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["vendedor", "supervisor", "gerente_comercial"]);

    if (pessoas && pessoas.length > 0) {
      await supabase
        .from("enrollments")
        .upsert(
          pessoas.map((p) => ({ user_id: p.id, course_id: curso.id })),
          { onConflict: "user_id,course_id", ignoreDuplicates: true },
        );
    }
  }

  redirect(`/admin/treinamentos/${curso.id}/editar`);
}
