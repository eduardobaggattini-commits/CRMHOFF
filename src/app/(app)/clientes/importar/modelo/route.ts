import * as XLSX from "xlsx";
import { exigirAdmin } from "@/lib/auth";

const COLUNAS = [
  "nome",
  "documento",
  "telefone",
  "email",
  "cidade",
  "estado",
  "endereco",
  "vendedor_email",
  "observacoes",
];

const LINHA_EXEMPLO = [
  "João Silva",
  "123.456.789-00",
  "(11) 99999-0000",
  "joao@cliente.com.br",
  "São Paulo",
  "SP",
  "Rua Exemplo, 123",
  "vendedor@hoff.com.br",
  "Cliente prioritário",
];

export async function GET() {
  await exigirAdmin();

  const planilha = XLSX.utils.aoa_to_sheet([COLUNAS, LINHA_EXEMPLO]);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Clientes");

  const buffer = XLSX.write(livro, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=modelo-clientes.xlsx",
    },
  });
}
