"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function criarCategoria(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const nome = formData.get("nome") as string;
  const parentId = (formData.get("parentId") as string) || null;

  await supabase.from("price_categories").insert({ nome, parent_id: parentId });

  if (parentId) {
    revalidatePath(`/tabela-precos/categoria/${parentId}`);
  }
  revalidatePath("/tabela-precos");
}

export async function renomearCategoriaRaiz(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const categoryId = formData.get("categoryId") as string;
  const nome = formData.get("nome") as string;

  await supabase.from("price_categories").update({ nome }).eq("id", categoryId);

  revalidatePath("/tabela-precos");
}

// Pega o id da categoria e de todas as subpastas dela (e subpastas das subpastas).
async function coletarDescendentes(supabase: SupabaseClient, categoryId: string) {
  const todos = [categoryId];
  let fronteira = [categoryId];

  while (fronteira.length > 0) {
    const { data: filhos } = await supabase
      .from("price_categories")
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

  const { data: planilhas } = await supabase
    .from("price_sheets")
    .select("arquivo_path")
    .in("category_id", idsParaRemover);

  if (planilhas && planilhas.length > 0) {
    await supabase.storage.from("tabelas-precos").remove(planilhas.map((p) => p.arquivo_path));
  }

  await supabase.from("price_categories").delete().eq("id", categoryId);

  if (parentId) {
    revalidatePath(`/tabela-precos/categoria/${parentId}`);
  }
  revalidatePath("/tabela-precos");
}
