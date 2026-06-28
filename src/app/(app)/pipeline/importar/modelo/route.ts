import * as XLSX from "xlsx";
import { exigirAdmin } from "@/lib/auth";

const COLUNAS = ["nome_cliente", "telefone", "produto", "valor_estimado", "vendedor_email", "origem"];

const LINHA_EXEMPLO = [
  "João Silva",
  "(11) 99999-0000",
  "Pneu 295/80 R22.5",
  "4200",
  "vendedor@hoff.com.br",
  "Tráfego pago",
];

export async function GET() {
  await exigirAdmin();

  const planilha = XLSX.utils.aoa_to_sheet([COLUNAS, LINHA_EXEMPLO]);
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Leads");

  const buffer = XLSX.write(livro, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=modelo-leads.xlsx",
    },
  });
}
