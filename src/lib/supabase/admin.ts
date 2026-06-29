import { createClient } from "@supabase/supabase-js";
import { exigirEnv } from "@/lib/env";

// Cliente com a chave secreta — só pode ser usado em código de servidor
// ("use server"), nunca no navegador. Necessário pra criar/remover contas
// (auth.admin.*), já que isso exige privilégio de service role.
export function createAdminClient() {
  return createClient(
    exigirEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    exigirEnv(process.env.SUPABASE_SECRET_KEY, "SUPABASE_SECRET_KEY"),
  );
}
