"use client";

import { useState } from "react";
import { atualizarLead, removerLead } from "@/app/(app)/pipeline/actions";
import { ModalShell } from "./modal-shell";
import { ORIGENS_LEAD, formatarValor, nomeCliente, telefoneCliente, type Deal } from "./types";

export function DetalheLeadModal({
  deal,
  somenteLeitura = false,
  onClose,
  onAtualizado,
  onRemovido,
}: {
  deal: Deal;
  somenteLeitura?: boolean;
  onClose: () => void;
  onAtualizado: (deal: Deal) => void;
  onRemovido: (dealId: string) => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const [produto, setProduto] = useState(deal.produto);
  const [valor, setValor] = useState(deal.valor !== null ? String(deal.valor) : "");
  const [origem, setOrigem] = useState(deal.origem_lead ?? ORIGENS_LEAD[0]);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const atualizado = await atualizarLead({
      dealId: deal.id,
      produto,
      valor: valor ? Number(valor) : null,
      origemLead: origem,
    });
    setSalvando(false);
    if (atualizado) {
      onAtualizado(atualizado as unknown as Deal);
    }
  }

  async function handleRemover() {
    if (!confirm("Remover este lead? Essa ação não pode ser desfeita.")) return;
    await removerLead(deal.id);
    onRemovido(deal.id);
  }

  const telefone = telefoneCliente(deal);

  if (somenteLeitura) {
    return (
      <ModalShell titulo="Detalhes do lead" onClose={onClose}>
        <div className="mb-3 rounded-md bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-800">{nomeCliente(deal)}</p>
          {telefone && <p className="text-sm text-slate-500">{telefone}</p>}
        </div>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-slate-500">Produto de interesse</dt>
            <dd className="font-medium text-slate-800">{deal.produto}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Valor estimado</dt>
            <dd className="font-medium text-slate-800">
              {deal.valor !== null ? formatarValor(deal.valor) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Origem do lead</dt>
            <dd className="font-medium text-slate-800">{deal.origem_lead ?? "—"}</dd>
          </div>
          {deal.etapa === "perdido" && deal.motivo_perda && (
            <div>
              <dt className="text-slate-500">Motivo da perda</dt>
              <dd className="font-medium text-red-600">{deal.motivo_perda}</dd>
            </div>
          )}
        </dl>
        <p className="mt-4 text-xs text-slate-400">
          Você está em modo de acompanhamento — só o vendedor responsável edita este lead.
        </p>
      </ModalShell>
    );
  }

  return (
    <ModalShell titulo="Detalhes do lead" onClose={onClose}>
      <div className="mb-3 rounded-md bg-slate-50 px-3 py-2">
        <p className="text-sm font-medium text-slate-800">{nomeCliente(deal)}</p>
        {telefone && <p className="text-sm text-slate-500">{telefone}</p>}
        {deal.client && (
          <p className="mt-1 text-xs text-slate-400">
            Dados do cliente são gerenciados em Clientes pelo admin.
          </p>
        )}
      </div>

      <form onSubmit={handleSalvar} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Produto de interesse
          </label>
          <input
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Valor estimado (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Origem do lead</label>
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            {ORIGENS_LEAD.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {deal.etapa === "perdido" && deal.motivo_perda && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Motivo da perda: {deal.motivo_perda}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleRemover}
            className="text-sm font-medium text-red-600 underline"
          >
            Remover lead
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
