// O Supabase Storage rejeita acentos e alguns caracteres especiais no
// "caminho" interno do arquivo (dá erro "Invalid key"). Aqui a gente troca
// só o caminho salvo — o nome que aparece na tela continua com acento normal.
export function sanitizarNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
