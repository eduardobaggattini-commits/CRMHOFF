"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";

export async function renomearCategoria(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const categoryId = formData.get("categoryId") as string;
  const nome = formData.get("nome") as string;

  await supabase.from("divulgacao_categories").update({ nome }).eq("id", categoryId);

  revalidatePath(`/divulgacao/categoria/${categoryId}`);
  revalidatePath("/divulgacao");
}

// O arquivo já foi enviado direto pro Storage pelo navegador (ver
// UploadDiretoForm); aqui só registramos os caminhos no banco.
export async function registrarArquivosEnviados(
  categoryId: string,
  arquivos: { nomeArquivo: string; arquivoPath: string }[],
) {
  const { supabase, user } = await exigirAdmin();

  await supabase.from("divulgacao_files").insert(
    arquivos.map((a) => ({
      category_id: categoryId,
      nome_arquivo: a.nomeArquivo,
      arquivo_path: a.arquivoPath,
      criado_por: user.id,
    })),
  );

  revalidatePath(`/divulgacao/categoria/${categoryId}`);
  revalidatePath("/divulgacao");
}

export async function registrarSubstituicaoArquivo(
  fixo: { fileId: string; categoryId: string; arquivoPathAntigo: string },
  novo: { nomeArquivo: string; arquivoPath: string },
) {
  const { supabase } = await exigirAdmin();

  await supabase
    .from("divulgacao_files")
    .update({
      nome_arquivo: novo.nomeArquivo,
      arquivo_path: novo.arquivoPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", fixo.fileId);

  await supabase.storage.from("divulgacao").remove([fixo.arquivoPathAntigo]);

  revalidatePath(`/divulgacao/categoria/${fixo.categoryId}`);
}

export async function removerArquivo(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const fileId = formData.get("fileId") as string;
  const categoryId = formData.get("categoryId") as string;
  const arquivoPath = formData.get("arquivoPath") as string;

  await supabase.storage.from("divulgacao").remove([arquivoPath]);
  await supabase.from("divulgacao_files").delete().eq("id", fileId);

  revalidatePath(`/divulgacao/categoria/${categoryId}`);
  revalidatePath("/divulgacao");
}

export async function moverArquivo(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const fileId = formData.get("fileId") as string;
  const categoryId = formData.get("categoryId") as string;
  const novaCategoriaId = formData.get("novaCategoriaId") as string;

  await supabase
    .from("divulgacao_files")
    .update({ category_id: novaCategoriaId })
    .eq("id", fileId);

  revalidatePath(`/divulgacao/categoria/${categoryId}`);
  revalidatePath(`/divulgacao/categoria/${novaCategoriaId}`);
  revalidatePath("/divulgacao");
}
