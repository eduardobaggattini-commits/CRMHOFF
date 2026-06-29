import { createBrowserClient } from "@supabase/ssr";
import { exigirEnv } from "@/lib/env";

// Cliente do Supabase para ser usado no navegador (componentes "client").
export function createClient() {
  return createBrowserClient(
    exigirEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    exigirEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}
