"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";

function camposDoFormulario(formData: FormData) {
  return {
    nome: formData.get("nome") as string,
    empresa: (formData.get("empresa") as string) || null,
    documento: (formData.get("documento") as string) || null,
    telefone: (formData.get("telefone") as string) || null,
    email: (formData.get("email") as string) || null,
    cidade: (formData.get("cidade") as string) || null,
    estado: (formData.get("estado") as string) || null,
    endereco: (formData.get("endereco") as string) || null,
    observacoes: (formData.get("observacoes") as string) || null,
    responsavel_id: (formData.get("responsavel_id") as string) || null,
  };
}

export async function criarCliente(formData: FormData) {
  const { supabase } = await exigirAdmin();

  await supabase.from("clients").insert(camposDoFormulario(formData));

  revalidatePath("/clientes");
}

export async function atualizarCliente(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const clientId = formData.get("clientId") as string;

  await supabase.from("clients").update(camposDoFormulario(formData)).eq("id", clientId);

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function removerCliente(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const clientId = formData.get("clientId") as string;

  await supabase.from("clients").delete().eq("id", clientId);

  revalidatePath("/clientes");
}
