import { createClient } from "@supabase/supabase-js";

// Cliente com a chave secreta — só pode ser usado em código de servidor
// ("use server"), nunca no navegador. Necessário pra criar/remover contas
// (auth.admin.*), já que isso exige privilégio de service role.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}
