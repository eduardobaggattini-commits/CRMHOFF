"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { ORIGENS_LEAD } from "@/components/pipeline/types";

type LinhaPlanilha = {
  nome_cliente?: string;
  telefone?: string | number;
  produto?: string;
  valor_estimado?: string | number;
  vendedor_email?: string;
  origem?: string;
};

export type ResultadoImportacaoLeads = {
  sucesso: number;
  avisos: { linha: number; mensagem: string }[];
};

export async function importarLeads(formData: FormData): Promise<ResultadoImportacaoLeads> {
  const { supabase } = await exigirAdmin();

  const arquivo = formData.get("arquivo") as File | null;

  if (!arquivo || arquivo.size === 0) {
    return { sucesso: 0, avisos: [{ linha: 0, mensagem: "Nenhum arquivo enviado." }] };
  }

  const bytes = await arquivo.arrayBuffer();
  const livro = XLSX.read(bytes, { type: "array" });
  const planilha = livro.Sheets[livro.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<LinhaPlanilha>(planilha, { defval: "" });

  const { data: vendedoresRaw } = await supabase.from("profiles").select("id, email");
  const idPorEmail = new Map(
    (vendedoresRaw ?? []).map((v) => [v.email.toLowerCase().trim(), v.id]),
  );

  const avisos: ResultadoImportacaoLeads["avisos"] = [];
  let sucesso = 0;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const numeroLinha = i + 2; // +2: cabeçalho ocupa a linha 1 da planilha

    const nome = String(linha.nome_cliente ?? "").trim();
    if (!nome) {
      avisos.push({ linha: numeroLinha, mensagem: "Nome do cliente em branco — linha ignorada." });
      continue;
    }

    const vendedorEmail = String(linha.vendedor_email ?? "").trim().toLowerCase();
    if (!vendedorEmail) {
      avisos.push({ linha: numeroLinha, mensagem: "Vendedor em branco — linha ignorada." });
      continue;
    }

    const vendedorId = idPorEmail.get(vendedorEmail);
    if (!vendedorId) {
      avisos.push({
        linha: numeroLinha,
        mensagem: `Vendedor "${vendedorEmail}" não encontrado no sistema — linha ignorada.`,
      });
      continue;
    }

    const origem = String(linha.origem ?? "").trim();
    if (!ORIGENS_LEAD.includes(origem)) {
      avisos.push({
        linha: numeroLinha,
        mensagem: `Origem "${origem}" não é uma opção válida (use: ${ORIGENS_LEAD.join(", ")}) — linha ignorada.`,
      });
      continue;
    }

    const telefone = String(linha.telefone ?? "").trim() || null;
    const produto = String(linha.produto ?? "").trim() || "Produto não informado";
    const valorTexto = String(linha.valor_estimado ?? "").trim();
    const valor = valorTexto ? Number(valorTexto) : null;

    // Acha o cliente pelo nome ou cria um novo (quem importa é o admin).
    const { data: clienteExistente } = await supabase
      .from("clients")
      .select("id")
      .ilike("nome", nome)
      .maybeSingle();

    let clientId: string | null = clienteExistente?.id ?? null;

    if (!clientId) {
      const { data: novoCliente } = await supabase
        .from("clients")
        .insert({ nome, telefone, responsavel_id: vendedorId })
        .select("id")
        .single();
      clientId = novoCliente?.id ?? null;
    }

    await supabase.from("deals").insert({
      client_id: clientId,
      produto,
      valor,
      origem_lead: origem,
      responsavel_id: vendedorId,
      etapa: "novo_lead",
    });

    sucesso += 1;
  }

  revalidatePath("/pipeline");

  return { sucesso, avisos };
}
