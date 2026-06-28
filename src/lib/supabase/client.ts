import { createBrowserClient } from "@supabase/ssr";
import { obterEnvObrigatoria } from "@/lib/env";

// Cliente do Supabase para ser usado no navegador (componentes "client").
export function createClient() {
  return createBrowserClient(
    obterEnvObrigatoria("NEXT_PUBLIC_SUPABASE_URL"),
    obterEnvObrigatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
