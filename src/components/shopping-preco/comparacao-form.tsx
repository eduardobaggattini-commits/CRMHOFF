"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Plus, Trophy } from "lucide-react";
import { salvarComparacao, removerComparacao } from "@/app/(app)/shopping-de-preco/actions";

type Concorrente = { nome: string; preco: string };

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularDiferenca(precoHoff: number, precoConcorrente: number) {
  const diferenca = precoConcorrente - precoHoff;
  const percentual = precoConcorrente !== 0 ? (Math.abs(diferenca) / precoConcorrente) * 100 : 0;
  return { diferenca, percentual };
}

export function ComparacaoForm({
  comparacaoInicial,
}: {
  comparacaoInicial?: {
    id: string;
    produto: string;
    preco_hoff: number;
    price_comparison_competitors: { id: string; nome: string; preco: number }[];
  };
}) {
  const [produto, setProduto] = useState(comparacaoInicial?.produto ?? "");
  const [precoHoff, setPrecoHoff] = useState(
    comparacaoInicial ? String(comparacaoInicial.preco_hoff) : "",
  );
  const [concorrentes, setConcorrentes] = useState<Concorrente[]>(
    comparacaoInicial && comparacaoInicial.price_comparison_competitors.length > 0
      ? comparacaoInicial.price_comparison_competitors.map((c) => ({
          nome: c.nome,
          preco: String(c.preco),
        }))
      : [{ nome: "", preco: "" }],
  );
  const [salvando, setSalvando] = useState(false);

  const precoHoffNum = Number(precoHoff) || 0;

  function adicionarConcorrente() {
    setConcorrentes((prev) => [...prev, { nome: "", preco: "" }]);
  }

  function removerConcorrente(index: number) {
    setConcorrentes((prev) => prev.filter((_, i) => i !== index));
  }

  function atualizarConcorrente(index: number, campo: "nome" | "preco", valor: string) {
    setConcorrentes((prev) => prev.map((c, i) => (i === index ? { ...c, [campo]: valor } : c)));
  }

  const concorrentesValidos = concorrentes.filter((c) => c.nome.trim() && c.preco);

  const linhasResultado = [
    { nome: "HOFF", preco: precoHoffNum, ehHoff: true },
    ...concorrentesValidos.map((c) => ({
      nome: c.nome,
      preco: Number(c.preco) || 0,
      ehHoff: false,
    })),
  ];

  const maisBarato =
    precoHoffNum > 0 && linhasResultado.length > 1
      ? linhasResultado.reduce((min, item) => (item.preco < min.preco ? item : min), linhasResultado[0])
      : null;

  async function handleSalvar() {
    setSalvando(true);
    await salvarComparacao({
      id: comparacaoInicial?.id,
      produto,
      precoHoff: precoHoffNum,
      concorrentes: concorrentesValidos.map((c) => ({ nome: c.nome, preco: Number(c.preco) || 0 })),
    });
    setSalvando(false);
  }

  async function handleRemover() {
    if (!comparacaoInicial) return;
    if (!confirm("Remover esta comparação?")) return;
    await removerComparacao(comparacaoInicial.id);
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            {comparacaoInicial ? "Editar comparação" : "Nova comparação"}
          </h1>
          <Link href="/shopping-de-preco" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-6 shadow">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Produto / modelo
            </label>
            <input
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Ex: Pneu 295/80 R22.5"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Preço da Hoff (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={precoHoff}
              onChange={(e) => setPrecoHoff(e.target.value)}
              className="w-48 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <p className="mb-2 text-sm font-medium text-slate-700">Concorrentes</p>
          <div className="space-y-2">
            {concorrentes.map((c, i) => (
              <div key={i} className="flex items-end gap-2">
                <input
                  value={c.nome}
                  onChange={(e) => atualizarConcorrente(i, "nome", e.target.value)}
                  placeholder="Nome do concorrente"
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={c.preco}
                  onChange={(e) => atualizarConcorrente(i, "preco", e.target.value)}
                  placeholder="Preço (R$)"
                  className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removerConcorrente(i)}
                  className="rounded-md border border-slate-300 p-2 text-slate-500 hover:bg-slate-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={adicionarConcorrente}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Adicionar concorrente
          </button>
        </div>

        {linhasResultado.length > 1 && precoHoffNum > 0 && (
          <div className="mb-6 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Resultado</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="py-2 font-medium">Empresa</th>
                  <th className="py-2 font-medium">Preço</th>
                  <th className="py-2 font-medium">Diferença vs Hoff</th>
                </tr>
              </thead>
              <tbody>
                {linhasResultado.map((linha, i) => {
                  if (linha.ehHoff) {
                    return (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 font-semibold text-slate-800">HOFF</td>
                        <td className="py-2 text-slate-700">{formatarValor(linha.preco)}</td>
                        <td className="py-2 text-slate-400">—</td>
                      </tr>
                    );
                  }
                  const { diferenca, percentual } = calcularDiferenca(precoHoffNum, linha.preco);
                  const hoffMaisBarata = diferenca > 0;
                  return (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{linha.nome}</td>
                      <td className="py-2 text-slate-700">{formatarValor(linha.preco)}</td>
                      <td
                        className={`py-2 font-medium ${
                          hoffMaisBarata
                            ? "text-emerald-600"
                            : diferenca < 0
                              ? "text-red-600"
                              : "text-slate-500"
                        }`}
                      >
                        {diferenca === 0
                          ? "Mesmo preço"
                          : `Hoff ${formatarValor(Math.abs(diferenca))} (${percentual.toFixed(1)}%) ${
                              hoffMaisBarata ? "mais barata" : "mais cara"
                            }`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {maisBarato && (
              <p className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                <Trophy className="h-4 w-4" />
                Mais barato: {maisBarato.nome}
              </p>
            )}

            <button
              type="button"
              disabled
              title="Em breve"
              className="mt-4 cursor-not-allowed rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-400"
            >
              Ver Calculadora de CPK (em breve)
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          {comparacaoInicial ? (
            <button onClick={handleRemover} className="text-sm font-medium text-red-600 underline">
              Remover comparação
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSalvar}
            disabled={salvando || !produto || !precoHoff}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar comparação"}
          </button>
        </div>
      </div>
    </main>
  );
}
