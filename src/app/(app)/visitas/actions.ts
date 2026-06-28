"use server";

import { revalidatePath } from "next/cache";
import { exigirUsuario } from "@/lib/auth";

export async function obterEndereco(
  latitude: number,
  longitude: number,
): Promise<{ enderecoCompleto: string | null; cidade: string | null }> {
  try {
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=${latitude}&lon=${longitude}`,
      { headers: { "User-Agent": "plataforma-treinamentos/1.0" } },
    );
    const dados = await resposta.json();
    const endereco = dados?.address ?? {};
    // Nem toda localização tem o mesmo nível de detalhe no OpenStreetMap;
    // tentamos os campos do mais específico (cidade) ao mais genérico.
    const cidade: string | null =
      endereco.city ?? endereco.town ?? endereco.village ?? endereco.municipality ?? endereco.county ?? null;
    return { enderecoCompleto: (dados?.display_name as string) ?? null, cidade };
  } catch {
    return { enderecoCompleto: null, cidade: null };
  }
}

export async function registrarVisita(input: {
  clientId: string | null;
  clienteNomeLivre: string;
  objetivo: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  enderecoAproximado: string | null;
  cidadeAproximada: string | null;
}) {
  const { supabase, user } = await exigirUsuario();

  await supabase.from("visitas").insert({
    client_id: input.clientId,
    cliente_nome_livre: input.clientId ? null : input.clienteNomeLivre,
    objetivo: input.objetivo,
    status: input.status,
    vendedor_id: user.id,
    latitude: input.latitude,
    longitude: input.longitude,
    endereco_aproximado: input.enderecoAproximado,
    cidade_aproximada: input.cidadeAproximada,
  });

  revalidatePath("/visitas");
}

export async function criarRoteiro(input: {
  vendedorId: string;
  linhas: { clienteId: string; dataPlanejada: string; horaPlanejada: string; objetivo: string }[];
}) {
  const { supabase, user } = await exigirUsuario();

  const linhasValidas = input.linhas.filter((l) => l.clienteId && l.dataPlanejada);
  if (linhasValidas.length === 0) return;

  // A trava de quem pode planejar visita pra quem é feita pelo banco (RLS):
  // só passa se o vendedor escolhido estiver na árvore de quem está criando.
  await supabase.from("visitas").insert(
    linhasValidas.map((l) => ({
      client_id: l.clienteId,
      objetivo: l.objetivo,
      status: "Agendada",
      vendedor_id: input.vendedorId,
      planejado_por: user.id,
      data_planejada: l.dataPlanejada,
      hora_planejada: l.horaPlanejada || null,
      data_hora: null,
    })),
  );

  revalidatePath("/visitas");
}

export async function confirmarCheckIn(input: {
  visitaId: string;
  status: string;
  observacao: string;
  latitude: number | null;
  longitude: number | null;
  enderecoAproximado: string | null;
  cidadeAproximada: string | null;
}) {
  const { supabase } = await exigirUsuario();

  await supabase
    .from("visitas")
    .update({
      status: input.status,
      observacao: input.observacao || null,
      data_hora: new Date().toISOString(),
      latitude: input.latitude,
      longitude: input.longitude,
      endereco_aproximado: input.enderecoAproximado,
      cidade_aproximada: input.cidadeAproximada,
    })
    .eq("id", input.visitaId);

  revalidatePath("/visitas");
}

export async function remarcarVisita(formData: FormData) {
  const { supabase } = await exigirUsuario();

  const visitaId = formData.get("visitaId") as string;
  const novaData = formData.get("novaData") as string;
  const nota = (formData.get("nota") as string) || "";

  const { data: atual } = await supabase
    .from("visitas")
    .select("observacao, data_planejada")
    .eq("id", visitaId)
    .single();

  const linhaHistorico = `Remarcada de ${atual?.data_planejada ?? "—"} para ${novaData}${nota ? `: ${nota}` : ""}.`;
  const observacao = [atual?.observacao, linhaHistorico].filter(Boolean).join("\n");

  await supabase
    .from("visitas")
    .update({ data_planejada: novaData, status: "Agendada", observacao })
    .eq("id", visitaId);

  revalidatePath("/visitas");
}

export async function cancelarVisitaPlanejada(formData: FormData) {
  const { supabase } = await exigirUsuario();

  const visitaId = formData.get("visitaId") as string;

  await supabase.from("visitas").update({ status: "Cancelada" }).eq("id", visitaId);

  revalidatePath("/visitas");
}
