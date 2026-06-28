"use client";

import { useState } from "react";
import { Download, CheckCircle2, AlertTriangle } from "lucide-react";
import { importarLeads, type ResultadoImportacaoLeads } from "@/app/(app)/pipeline/importar/actions";

export function ImportarLeadsForm() {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacaoLeads | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setResultado(null);
    const formData = new FormData(e.currentTarget);
    const res = await importarLeads(formData);
    setResultado(res);
    setEnviando(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">Como importar</h2>
        <ol className="mb-4 list-inside list-decimal space-y-1 text-sm text-slate-600">
          <li>Baixe o modelo de planilha abaixo.</li>
          <li>
            Preencha as colunas (nome do cliente, vendedor e origem são obrigatórios).
          </li>
          <li>Envie o arquivo preenchido (.xlsx ou .csv).</li>
        </ol>
        <a
          href="/pipeline/importar/modelo"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Baixar modelo (.xlsx)
        </a>
        <p className="mt-3 text-xs text-slate-400">
          Colunas: nome_cliente, telefone, produto, valor_estimado, vendedor_email, origem
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Enviar planilha</h2>
        <div className="flex items-end gap-2">
          <input
            name="arquivo"
            type="file"
            accept=".xlsx,.csv"
            required
            className="flex-1 text-sm text-slate-600"
          />
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {enviando ? "Importando..." : "Importar"}
          </button>
        </div>
      </form>

      {resultado && (
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Resultado da importação</h2>
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {resultado.sucesso} lead(s) importado(s) em &quot;Novo lead&quot;
          </p>
          {resultado.avisos.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                {resultado.avisos.length} linha(s) com erro (não importadas)
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {resultado.avisos.map((a, i) => (
                  <li key={i}>
                    Linha {a.linha}: {a.mensagem}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
