"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";

type LinhaPlanilha = {
  nome?: string;
  documento?: string | number;
  telefone?: string | number;
  email?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  vendedor_email?: string;
  observacoes?: string;
};

export type ResultadoImportacao = {
  sucesso: number;
  avisos: { linha: number; mensagem: string }[];
};

function normalizarDocumento(valor: string) {
  return valor.replace(/\D/g, "");
}

export async function importarPlanilha(formData: FormData): Promise<ResultadoImportacao> {
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

  const avisos: ResultadoImportacao["avisos"] = [];
  let sucesso = 0;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const numeroLinha = i + 2; // +2: cabeçalho ocupa a linha 1 da planilha

    const nome = String(linha.nome ?? "").trim();
    if (!nome) {
      avisos.push({ linha: numeroLinha, mensagem: "Nome em branco — linha ignorada." });
      continue;
    }

    let responsavelId: string | null = null;
    const vendedorEmail = String(linha.vendedor_email ?? "").trim().toLowerCase();
    if (vendedorEmail) {
      responsavelId = idPorEmail.get(vendedorEmail) ?? null;
      if (!responsavelId) {
        avisos.push({
          linha: numeroLinha,
          mensagem: `Vendedor "${vendedorEmail}" não encontrado — importado sem vendedor.`,
        });
      }
    }

    const documentoOriginal = String(linha.documento ?? "").trim();
    const documento = documentoOriginal ? normalizarDocumento(documentoOriginal) : null;
    if (documento && documento.length !== 11 && documento.length !== 14) {
      avisos.push({
        linha: numeroLinha,
        mensagem: `Documento "${documentoOriginal}" não parece um CPF/CNPJ válido — importado assim mesmo.`,
      });
    }

    const dadosCliente = {
      nome,
      documento,
      telefone: String(linha.telefone ?? "").trim() || null,
      email: String(linha.email ?? "").trim() || null,
      cidade: String(linha.cidade ?? "").trim() || null,
      estado: String(linha.estado ?? "").trim() || null,
      endereco: String(linha.endereco ?? "").trim() || null,
      observacoes: String(linha.observacoes ?? "").trim() || null,
      responsavel_id: responsavelId,
    };

    let clienteExistenteId: string | null = null;
    if (documento) {
      const { data: existente } = await supabase
        .from("clients")
        .select("id")
        .eq("documento", documento)
        .maybeSingle();
      clienteExistenteId = existente?.id ?? null;
    }

    if (clienteExistenteId) {
      await supabase.from("clients").update(dadosCliente).eq("id", clienteExistenteId);
    } else {
      await supabase.from("clients").insert(dadosCliente);
    }

    sucesso += 1;
  }

  revalidatePath("/clientes");

  return { sucesso, avisos };
}
