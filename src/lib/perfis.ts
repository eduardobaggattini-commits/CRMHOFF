export const ROTULO_PAPEL: Record<string, string> = {
  admin: "Administrador",
  gerente_comercial: "Gerente comercial",
  supervisor: "Supervisor",
  vendedor: "Vendedor",
};

// Quem pode só acompanhar (ler) os dados da equipe, mas nunca editar.
export function ehSomenteLeitura(papel: string | undefined) {
  return papel === "gerente_comercial" || papel === "supervisor";
}

// Quem pode ver dados de equipe (admin vê tudo; gerente/supervisor veem a árvore).
export function podeAcompanharEquipe(papel: string | undefined) {
  return papel === "admin" || ehSomenteLeitura(papel);
}
