"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Phone } from "lucide-react";
import { moverEtapa } from "@/app/(app)/pipeline/actions";
import { NovoLeadModal } from "./novo-lead-modal";
import { DetalheLeadModal } from "./detalhe-lead-modal";
import { MotivoPerdaModal } from "./motivo-perda-modal";
import { COLUNAS, CORES_ETAPA, formatarValor, nomeCliente, telefoneCliente, type Deal } from "./types";

function Card({
  deal,
  onClick,
  somenteLeitura,
}: {
  deal: Deal;
  onClick: () => void;
  somenteLeitura: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    disabled: somenteLeitura,
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 10 }
    : undefined;

  const telefone = telefoneCliente(deal);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(somenteLeitura ? {} : listeners)}
      {...(somenteLeitura ? {} : attributes)}
      onClick={onClick}
      className={`cursor-pointer touch-none rounded-lg border border-slate-200 bg-white p-2 shadow-sm transition-shadow hover:shadow ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <p className="text-sm font-medium text-slate-800">{nomeCliente(deal)}</p>
      {telefone && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <Phone className="h-3 w-3" />
          {telefone}
        </p>
      )}
      <p className="mt-1 text-xs text-slate-600">{deal.produto}</p>
      {deal.valor !== null && (
        <p className="mt-0.5 text-xs font-semibold text-indigo-600">{formatarValor(deal.valor)}</p>
      )}
      {deal.origem_lead && (
        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
          {deal.origem_lead}
        </span>
      )}
      {deal.etapa === "perdido" && deal.motivo_perda && (
        <p className="mt-1 text-[11px] text-red-500">Motivo: {deal.motivo_perda}</p>
      )}
    </div>
  );
}

function Coluna({
  etapa,
  titulo,
  deals,
  onCardClick,
  somenteLeitura,
}: {
  etapa: string;
  titulo: string;
  deals: Deal[];
  onCardClick: (deal: Deal) => void;
  somenteLeitura: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa, disabled: somenteLeitura });
  const cor = CORES_ETAPA[etapa];

  return (
    <div className={`w-60 flex-shrink-0 rounded-2xl border ${cor.borda} ${cor.fundo} p-2`}>
      <h2 className={`mb-2 px-1 text-xs font-semibold uppercase tracking-wide ${cor.texto}`}>
        {titulo} ({deals.length})
      </h2>
      <div
        ref={setNodeRef}
        className={`min-h-[40px] space-y-2 rounded-xl transition-shadow ${
          isOver ? "ring-2 ring-indigo-400" : ""
        }`}
      >
        {deals.map((deal) => (
          <Card
            key={deal.id}
            deal={deal}
            onClick={() => onCardClick(deal)}
            somenteLeitura={somenteLeitura}
          />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard({
  dealsIniciais,
  clientes,
  somenteLeitura = false,
}: {
  dealsIniciais: Deal[];
  clientes: { id: string; nome: string; telefone: string | null }[];
  somenteLeitura?: boolean;
}) {
  const [deals, setDeals] = useState(dealsIniciais);
  const [leadSelecionado, setLeadSelecionado] = useState<Deal | null>(null);
  const [modalNovoLead, setModalNovoLead] = useState(false);
  const [pendenteMotivoPerda, setPendenteMotivoPerda] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const novaEtapa = over.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.etapa === novaEtapa) return;

    if (novaEtapa === "perdido") {
      setPendenteMotivoPerda(dealId);
      return;
    }

    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, etapa: novaEtapa, motivo_perda: null } : d)),
    );
    startTransition(() => {
      moverEtapa(dealId, novaEtapa);
    });
  }

  function confirmarPerda(motivo: string) {
    if (!pendenteMotivoPerda) return;
    const dealId = pendenteMotivoPerda;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, etapa: "perdido", motivo_perda: motivo } : d)),
    );
    startTransition(() => {
      moverEtapa(dealId, "perdido", { motivoPerda: motivo });
    });
    setPendenteMotivoPerda(null);
  }

  return (
    <div>
      {!somenteLeitura && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setModalNovoLead(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Novo lead
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUNAS.map((coluna) => (
            <Coluna
              key={coluna.etapa}
              etapa={coluna.etapa}
              titulo={coluna.titulo}
              deals={deals.filter((d) => d.etapa === coluna.etapa)}
              onCardClick={setLeadSelecionado}
              somenteLeitura={somenteLeitura}
            />
          ))}
        </div>
      </DndContext>

      {modalNovoLead && (
        <NovoLeadModal
          clientes={clientes}
          onClose={() => setModalNovoLead(false)}
          onCriado={(novoDeal) => {
            setDeals((prev) => [novoDeal, ...prev]);
            setModalNovoLead(false);
          }}
        />
      )}

      {leadSelecionado && (
        <DetalheLeadModal
          deal={leadSelecionado}
          somenteLeitura={somenteLeitura}
          onClose={() => setLeadSelecionado(null)}
          onAtualizado={(atualizado) => {
            setDeals((prev) => prev.map((d) => (d.id === atualizado.id ? atualizado : d)));
            setLeadSelecionado(null);
          }}
          onRemovido={(id) => {
            setDeals((prev) => prev.filter((d) => d.id !== id));
            setLeadSelecionado(null);
          }}
        />
      )}

      {pendenteMotivoPerda && (
        <MotivoPerdaModal
          onCancelar={() => setPendenteMotivoPerda(null)}
          onConfirmar={confirmarPerda}
        />
      )}
    </div>
  );
}
