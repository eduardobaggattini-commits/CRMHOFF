"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { criarRoteiro } from "@/app/(app)/visitas/actions";
import { OBJETIVOS_VISITA } from "@/lib/visitas-constantes";

type Pessoa = { id: string; nome: string };

type Linha = {
  chave: number;
  clienteTexto: string;
  clienteId: string | null;
  dataPlanejada: string;
  horaPlanejada: string;
  objetivo: string;
};

function novaLinha(chave: number): Linha {
  return {
    chave,
    clienteTexto: "",
    clienteId: null,
    dataPlanejada: "",
    horaPlanejada: "",
    objetivo: OBJETIVOS_VISITA[0],
  };
}

export function CriarRoteiroForm({
  vendedores,
  clientes,
}: {
  vendedores: Pessoa[];
  clientes: Pessoa[];
}) {
  const router = useRouter();
  const [vendedorId, setVendedorId] = useState(vendedores[0]?.id ?? "");
  const [linhas, setLinhas] = useState<Linha[]>([novaLinha(0)]);
  const [proximaChave, setProximaChave] = useState(1);
  const [salvando, setSalvando] = useState(false);

  function atualizarLinha(chave: number, dados: Partial<Linha>) {
    setLinhas((atual) => atual.map((l) => (l.chave === chave ? { ...l, ...dados } : l)));
  }

  function definirCliente(chave: number, texto: string) {
    const correspondencia = clientes.find((c) => c.nome.toLowerCase() === texto.trim().toLowerCase());
    atualizarLinha(chave, { clienteTexto: texto, clienteId: correspondencia?.id ?? null });
  }

  function adicionarLinha() {
    setLinhas((atual) => [...atual, novaLinha(proximaChave)]);
    setProximaChave((n) => n + 1);
  }

  function removerLinha(chave: number) {
    setLinhas((atual) => atual.filter((l) => l.chave !== chave));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendedorId) return;

    setSalvando(true);
    await criarRoteiro({
      vendedorId,
      linhas: linhas
        .filter((l) => l.clienteId && l.dataPlanejada)
        .map((l) => ({
          clienteId: l.clienteId!,
          dataPlanejada: l.dataPlanejada,
          horaPlanejada: l.horaPlanejada,
          objetivo: l.objetivo,
        })),
    });
    setSalvando(false);
    router.push("/visitas?aba=roteiro");
  }

  const algumaLinhaIncompleta = linhas.some((l) => l.clienteTexto && !l.clienteId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Vendedor</label>
        <select
          value={vendedorId}
          onChange={(e) => setVendedorId(e.target.value)}
          required
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {vendedores.length === 0 && <option value="">Nenhum vendedor disponível</option>}
          {vendedores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-700">Visitas planejadas</label>
        {linhas.map((linha) => (
          <div key={linha.chave} className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 p-3">
            <div className="min-w-[180px] flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-600">Cliente</label>
              <input
                value={linha.clienteTexto}
                onChange={(e) => definirCliente(linha.chave, e.target.value)}
                list="lista-clientes-roteiro"
                placeholder="Busque um cliente cadastrado"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
              {linha.clienteTexto && !linha.clienteId && (
                <p className="mt-1 text-xs text-amber-600">Esse cliente não está cadastrado na base.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Data planejada</label>
              <input
                type="date"
                value={linha.dataPlanejada}
                onChange={(e) => atualizarLinha(linha.chave, { dataPlanejada: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Horário (opcional)</label>
              <input
                type="time"
                value={linha.horaPlanejada}
                onChange={(e) => atualizarLinha(linha.chave, { horaPlanejada: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Objetivo</label>
              <select
                value={linha.objetivo}
                onChange={(e) => atualizarLinha(linha.chave, { objetivo: e.target.value })}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                {OBJETIVOS_VISITA.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            {linhas.length > 1 && (
              <button
                type="button"
                onClick={() => removerLinha(linha.chave)}
                className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remover linha"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <datalist id="lista-clientes-roteiro">
          {clientes.map((c) => (
            <option key={c.id} value={c.nome} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={adicionarLinha}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Adicionar visita
        </button>
      </div>

      {algumaLinhaIncompleta && (
        <p className="text-xs text-amber-600">
          Algumas linhas têm um cliente que não foi encontrado na base — elas não serão salvas. O roteiro só aceita
          clientes já cadastrados.
        </p>
      )}

      <button
        type="submit"
        disabled={salvando || !vendedorId}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {salvando ? "Salvando..." : "Salvar roteiro"}
      </button>
    </form>
  );
}
