"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function criarCategoria(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const nome = formData.get("nome") as string;
  const parentId = (formData.get("parentId") as string) || null;

  await supabase.from("divulgacao_categories").insert({ nome, parent_id: parentId });

  if (parentId) {
    revalidatePath(`/divulgacao/categoria/${parentId}`);
  }
  revalidatePath("/divulgacao");
}

// Pega o id da pasta e de todas as subpastas dela (e subpastas das subpastas).
async function coletarDescendentes(supabase: SupabaseClient, categoryId: string) {
  const todos = [categoryId];
  let fronteira = [categoryId];

  while (fronteira.length > 0) {
    const { data: filhos } = await supabase
      .from("divulgacao_categories")
      .select("id")
      .in("parent_id", fronteira);

    const novosIds = (filhos ?? []).map((f) => f.id as string);
    todos.push(...novosIds);
    fronteira = novosIds;
  }

  return todos;
}

export async function removerCategoria(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const categoryId = formData.get("categoryId") as string;
  const parentId = (formData.get("parentId") as string) || null;

  const idsParaRemover = await coletarDescendentes(supabase, categoryId);

  const { data: arquivos } = await supabase
    .from("divulgacao_files")
    .select("arquivo_path")
    .in("category_id", idsParaRemover);

  if (arquivos && arquivos.length > 0) {
    await supabase.storage.from("divulgacao").remove(arquivos.map((a) => a.arquivo_path));
  }

  await supabase.from("divulgacao_categories").delete().eq("id", categoryId);

  if (parentId) {
    revalidatePath(`/divulgacao/categoria/${parentId}`);
  }
  revalidatePath("/divulgacao");
}
