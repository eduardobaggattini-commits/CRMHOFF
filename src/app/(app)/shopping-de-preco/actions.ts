"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/auth";

export async function salvarComparacao(input: {
  id?: string;
  produto: string;
  precoHoff: number;
  concorrentes: { nome: string; preco: number }[];
}) {
  const { supabase, user } = await exigirUsuario();

  let comparisonId = input.id;

  if (comparisonId) {
    await supabase
      .from("price_comparisons")
      .update({ produto: input.produto, preco_hoff: input.precoHoff })
      .eq("id", comparisonId);

    await supabase.from("price_comparison_competitors").delete().eq("comparison_id", comparisonId);
  } else {
    const { data } = await supabase
      .from("price_comparisons")
      .insert({
        produto: input.produto,
        preco_hoff: input.precoHoff,
        responsavel_id: user.id,
      })
      .select("id")
      .single();
    comparisonId = data?.id;
  }

  if (comparisonId && input.concorrentes.length > 0) {
    await supabase.from("price_comparison_competitors").insert(
      input.concorrentes.map((c) => ({
        comparison_id: comparisonId,
        nome: c.nome,
        preco: c.preco,
      })),
    );
  }

  revalidatePath("/shopping-de-preco");
  redirect(`/shopping-de-preco/${comparisonId}`);
}

export async function removerComparacao(id: string) {
  const { supabase } = await exigirUsuario();

  await supabase.from("price_comparisons").delete().eq("id", id);

  revalidatePath("/shopping-de-preco");
  redirect("/shopping-de-preco");
}
