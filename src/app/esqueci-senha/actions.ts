"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function solicitarRedefinicaoSenha(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const origin = (await headers()).get("origin");

  // Não informamos se o e-mail existe ou não na base — a mensagem na tela é
  // a mesma nos dois casos, por segurança.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  redirect("/esqueci-senha?enviado=1");
}
