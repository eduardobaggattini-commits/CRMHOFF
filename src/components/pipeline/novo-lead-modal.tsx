"use client";

import { useState } from "react";
import { criarLead } from "@/app/(app)/pipeline/actions";
import { ModalShell } from "./modal-shell";
import { ORIGENS_LEAD, type Deal } from "./types";

export function NovoLeadModal({
  clientes,
  onClose,
  onCriado,
}: {
  clientes: { id: string; nome: string; telefone: string | null }[];
  onClose: () => void;
  onCriado: (deal: Deal) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [textoCliente, setTextoCliente] = useState("");
  const [clientIdSelecionado, setClientIdSelecionado] = useState<string | null>(null);
  const [telefoneLivre, setTelefoneLivre] = useState("");
  const [produto, setProduto] = useState("");
  const [valor, setValor] = useState("");
  const [origem, setOrigem] = useState(ORIGENS_LEAD[0]);

  function handleTextoCliente(valor: string) {
    setTextoCliente(valor);
    const correspondencia = clientes.find(
      (c) => c.nome.toLowerCase() === valor.trim().toLowerCase(),
    );
    setClientIdSelecionado(correspondencia?.id ?? null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textoCliente.trim()) return;
    setEnviando(true);
    const novoDeal = await criarLead({
      clientId: clientIdSelecionado,
      clienteNomeLivre: textoCliente.trim(),
      clienteTelefoneLivre: telefoneLivre,
      produto,
      valor: valor ? Number(valor) : null,
      origemLead: origem,
    });
    setEnviando(false);
    if (novoDeal) {
      onCriado(novoDeal as unknown as Deal);
    }
  }

  return (
    <ModalShell titulo="Novo lead" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
          <input
            value={textoCliente}
            onChange={(e) => handleTextoCliente(e.target.value)}
            list="lista-clientes-pipeline"
            placeholder="Busque um cliente cadastrado ou digite o nome"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <datalist id="lista-clientes-pipeline">
            {clientes.map((c) => (
              <option key={c.id} value={c.nome} />
            ))}
          </datalist>
        </div>

        {!clientIdSelecionado && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Telefone / WhatsApp
            </label>
            <input
              value={telefoneLivre}
              onChange={(e) => setTelefoneLivre(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        )}

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
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {enviando ? "Criando..." : "Criar lead"}
        </button>
      </form>
    </ModalShell>
  );
}
