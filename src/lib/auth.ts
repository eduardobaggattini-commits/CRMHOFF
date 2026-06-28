import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Toda página dentro de (app) chama exigirUsuario/exigirAdmin, e o layout
// também chama. Sem isso, cada clique fazia a mesma pergunta "quem é esse
// usuário?" pro Supabase 2-3 vezes. Com cache(), a resposta é reaproveitada
// dentro da mesma requisição (não vaza entre pessoas diferentes).
const obterUsuarioEPerfil = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, perfil: null };
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, role, pontos")
    .eq("id", user.id)
    .single();

  return { supabase, user, perfil };
});

// Usado nas páginas que só o administrador pode ver.
// Se a pessoa não estiver logada ou não for admin, ela é redirecionada.
export async function exigirAdmin() {
  const { supabase, user, perfil } = await obterUsuarioEPerfil();

  if (!user) {
    redirect("/login");
  }

  if (perfil?.role !== "admin") {
    redirect("/");
  }

  return { supabase, user, perfil };
}

// Usado nas páginas que exigem apenas estar logado.
export async function exigirUsuario() {
  const { supabase, user, perfil } = await obterUsuarioEPerfil();

  if (!user) {
    redirect("/login");
  }

  return { supabase, user, perfil };
}
