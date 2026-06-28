"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";

export async function renomearCategoria(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const categoryId = formData.get("categoryId") as string;
  const nome = formData.get("nome") as string;

  await supabase.from("price_categories").update({ nome }).eq("id", categoryId);

  revalidatePath(`/tabela-precos/categoria/${categoryId}`);
  revalidatePath("/tabela-precos");
}

// O arquivo já foi enviado direto pro Storage pelo navegador (ver
// UploadDiretoForm); aqui só registramos os caminhos no banco.
export async function registrarPdfsEnviados(
  categoryId: string,
  arquivos: { nomeArquivo: string; arquivoPath: string }[],
) {
  const { supabase, user } = await exigirAdmin();

  await supabase.from("price_sheets").insert(
    arquivos.map((a) => ({
      category_id: categoryId,
      nome_arquivo: a.nomeArquivo,
      arquivo_path: a.arquivoPath,
      criado_por: user.id,
    })),
  );

  revalidatePath(`/tabela-precos/categoria/${categoryId}`);
  revalidatePath("/tabela-precos");
}

export async function registrarSubstituicaoArquivo(
  fixo: { sheetId: string; categoryId: string; arquivoPathAntigo: string },
  novo: { nomeArquivo: string; arquivoPath: string },
) {
  const { supabase } = await exigirAdmin();

  await supabase
    .from("price_sheets")
    .update({
      nome_arquivo: novo.nomeArquivo,
      arquivo_path: novo.arquivoPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fixo.sheetId);

  await supabase.storage.from("tabelas-precos").remove([fixo.arquivoPathAntigo]);

  revalidatePath(`/tabela-precos/categoria/${fixo.categoryId}`);
}

export async function removerPdf(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const sheetId = formData.get("sheetId") as string;
  const categoryId = formData.get("categoryId") as string;
  const arquivoPath = formData.get("arquivoPath") as string;

  await supabase.storage.from("tabelas-precos").remove([arquivoPath]);
  await supabase.from("price_sheets").delete().eq("id", sheetId);

  revalidatePath(`/tabela-precos/categoria/${categoryId}`);
  revalidatePath("/tabela-precos");
}

export async function moverPlanilha(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const sheetId = formData.get("sheetId") as string;
  const categoryId = formData.get("categoryId") as string;
  const novaCategoriaId = formData.get("novaCategoriaId") as string;

  await supabase
    .from("price_sheets")
    .update({ category_id: novaCategoriaId })
    .eq("id", sheetId);

  revalidatePath(`/tabela-precos/categoria/${categoryId}`);
  revalidatePath(`/tabela-precos/categoria/${novaCategoriaId}`);
  revalidatePath("/tabela-precos");
}
