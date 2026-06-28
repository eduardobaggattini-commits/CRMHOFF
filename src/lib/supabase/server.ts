import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente do Supabase para ser usado em Server Components, Server Actions
// e Route Handlers (código que roda no servidor, não no navegador).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Pode ser chamado de um Server Component, onde não é permitido
            // alterar cookies. O middleware cuida de renovar a sessão nesse caso.
          }
        },
      },
    },
  );
}
