// Em vez de deixar o Supabase quebrar com um erro genérico (ex: "Invalid
// URL") quando falta configurar uma variável na Vercel, falha com uma
// mensagem que diz exatamente qual variável está faltando.
//
// Importante: recebe o valor já lido (process.env.NOME) em vez de ler aqui
// dentro por conta própria (process.env[nome]). O Next.js só consegue
// "embutir" variáveis NEXT_PUBLIC_ no código do navegador quando o acesso é
// escrito de forma literal (process.env.NOME) — um acesso dinâmico não é
// reconhecido e a variável vira undefined no navegador.
export function exigirEnv(valor: string | undefined, nome: string): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente "${nome}" não está definida. Configure-a em Vercel → Settings → Environment Variables (nas 3 caixas: Production/Preview/Development) e refaça o deploy.`,
    );
  }
  return valor;
}
