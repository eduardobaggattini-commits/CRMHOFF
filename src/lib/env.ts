// Em vez de deixar o Supabase quebrar com um erro genérico (ex: "Invalid
// URL") quando falta configurar uma variável na Vercel, falha com uma
// mensagem que diz exatamente qual variável está faltando.
export function obterEnvObrigatoria(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(
      `Variável de ambiente "${nome}" não está definida. Configure-a em Vercel → Settings → Environment Variables (nas 3 caixas: Production/Preview/Development) e refaça o deploy.`,
    );
  }
  return valor;
}
