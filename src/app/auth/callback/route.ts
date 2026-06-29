import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Recebe o link de e-mail (redefinir senha, etc.), troca o código por uma
// sessão de verdade e manda a pessoa pra tela certa.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?erro=${encodeURIComponent("Link inválido ou expirado. Solicite a redefinição novamente.")}`,
  );
}
