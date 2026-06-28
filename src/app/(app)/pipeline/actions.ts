"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/auth";

const SELECAO_DEAL =
  "id, produto, valor, etapa, motivo_perda, origem_lead, cliente_nome_livre, cliente_telefone_livre, client:clients(id, nome, telefone)";

export async function criarLead(input: {
  clientId: string | null;
  clienteNomeLivre: string;
  clienteTelefoneLivre: string;
  produto: string;
  valor: number | null;
  origemLead: string;
}) {
  const { supabase, user } = await exigirUsuario();

  const { data: novoDeal } = await supabase
    .from("deals")
    .insert({
      client_id: input.clientId,
      cliente_nome_livre: input.clientId ? null : input.clienteNomeLivre,
      cliente_telefone_livre: input.clientId ? null : input.clienteTelefoneLivre || null,
      produto: input.produto,
      valor: input.valor,
      origem_lead: input.origemLead,
      responsavel_id: user.id,
    })
    .select(SELECAO_DEAL)
    .single();

  revalidatePath("/pipeline");
  return novoDeal;
}

export async function moverEtapa(
  dealId: string,
  novaEtapa: string,
  extras?: { motivoPerda?: string },
) {
  const { supabase } = await exigirUsuario();

  const fechaAgora = novaEtapa === "fechado" || novaEtapa === "perdido";

  await supabase
    .from("deals")
    .update({
      etapa: novaEtapa,
      motivo_perda: novaEtapa === "perdido" ? extras?.motivoPerda ?? null : null,
      fechado_em: fechaAgora ? new Date().toISOString() : null,
    })
    .eq("id", dealId);

  revalidatePath("/pipeline");
}

export async function atualizarLead(input: {
  dealId: string;
  produto: string;
  valor: number | null;
  origemLead: string;
}) {
  const { supabase } = await exigirUsuario();

  const { data: atualizado } = await supabase
    .from("deals")
    .update({
      produto: input.produto,
      valor: input.valor,
      origem_lead: input.origemLead,
    })
    .eq("id", input.dealId)
    .select(SELECAO_DEAL)
    .single();

  revalidatePath("/pipeline");
  return atualizado;
}

export async function removerLead(dealId: string) {
  const { supabase } = await exigirUsuario();

  await supabase.from("deals").delete().eq("id", dealId);

  revalidatePath("/pipeline");
}
