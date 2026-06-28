// Conta quantos arquivos tem em cada pasta, somando também o que está
// dentro das subpastas (e subpastas das subpastas).
export function contarArquivosRecursivo(
  categorias: { id: string; parent_id: string | null }[],
  arquivos: { category_id: string }[],
): Map<string, number> {
  const paiPorId = new Map(categorias.map((c) => [c.id, c.parent_id]));
  const contagem = new Map<string, number>();

  for (const arquivo of arquivos) {
    let atual: string | null = arquivo.category_id;
    while (atual) {
      contagem.set(atual, (contagem.get(atual) ?? 0) + 1);
      atual = paiPorId.get(atual) ?? null;
    }
  }

  return contagem;
}
