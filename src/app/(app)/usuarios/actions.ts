"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function criarUsuario(formData: FormData) {
  await exigirAdmin();

  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const senha = formData.get("senha") as string;
  const role = formData.get("role") as string;
  const supervisorId = (formData.get("supervisor_id") as string) || null;
  const gerenteId = (formData.get("gerente_id") as string) || null;

  const clienteAdmin = createAdminClient();

  const { data, error } = await clienteAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });

  if (error || !data.user) {
    redirect(
      `/usuarios/novo?erro=${encodeURIComponent(error?.message ?? "Erro ao criar usuário.")}`,
    );
  }

  // O gatilho do banco já criou o perfil com papel "vendedor"; ajustamos
  // pro papel e vínculos escolhidos no formulário.
  await clienteAdmin
    .from("profiles")
    .update({
      role,
      supervisor_id: role === "vendedor" ? supervisorId : null,
      gerente_id: role === "vendedor" || role === "supervisor" ? gerenteId : null,
    })
    .eq("id", data.user.id);

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function atualizarUsuario(formData: FormData) {
  const { supabase } = await exigirAdmin();

  const userId = formData.get("userId") as string;
  const nome = formData.get("nome") as string;
  const role = formData.get("role") as string;
  const supervisorId = (formData.get("supervisor_id") as string) || null;
  const gerenteId = (formData.get("gerente_id") as string) || null;

  await supabase
    .from("profiles")
    .update({
      nome,
      role,
      supervisor_id: role === "vendedor" ? supervisorId : null,
      gerente_id: role === "vendedor" || role === "supervisor" ? gerenteId : null,
    })
    .eq("id", userId);

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function removerUsuario(formData: FormData) {
  await exigirAdmin();

  const userId = formData.get("userId") as string;

  const clienteAdmin = createAdminClient();
  await clienteAdmin.auth.admin.deleteUser(userId);

  revalidatePath("/usuarios");
}
