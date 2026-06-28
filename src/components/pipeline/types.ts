export type Deal = {
  id: string;
  produto: string;
  valor: number | null;
  etapa: string;
  motivo_perda: string | null;
  origem_lead: string | null;
  cliente_nome_livre: string | null;
  cliente_telefone_livre: string | null;
  client: { id: string; nome: string; telefone: string | null } | null;
};

export const COLUNAS: { etapa: string; titulo: string }[] = [
  { etapa: "novo_lead", titulo: "Novo lead" },
  { etapa: "em_negociacao", titulo: "Em negociação" },
  { etapa: "fechado", titulo: "Fechado (venda ganha)" },
  { etapa: "perdido", titulo: "Perdido" },
];

export const CORES_ETAPA: Record<string, { fundo: string; borda: string; texto: string }> = {
  novo_lead: { fundo: "bg-blue-50", borda: "border-blue-200", texto: "text-blue-700" },
  em_negociacao: { fundo: "bg-amber-50", borda: "border-amber-200", texto: "text-amber-700" },
  fechado: { fundo: "bg-emerald-50", borda: "border-emerald-200", texto: "text-emerald-700" },
  perdido: { fundo: "bg-red-50", borda: "border-red-200", texto: "text-red-700" },
};

export const ORIGENS_LEAD = [
  "Tráfego pago",
  "Cliente inativo",
  "Recapa sem pneu novo",
  "Outro",
];

export function formatarValor(valor: number | null) {
  if (valor === null) return null;
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function nomeCliente(deal: Deal) {
  return deal.client?.nome ?? deal.cliente_nome_livre ?? "Sem nome";
}

export function telefoneCliente(deal: Deal) {
  return deal.client?.telefone ?? deal.cliente_telefone_livre ?? null;
}
