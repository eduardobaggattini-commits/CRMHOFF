"use client";

import { useState } from "react";
import { ModalShell } from "./modal-shell";

export function MotivoPerdaModal({
  onCancelar,
  onConfirmar,
}: {
  onCancelar: () => void;
  onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!motivo.trim()) return;
    onConfirmar(motivo.trim());
  }

  return (
    <ModalShell titulo="Motivo da perda" onClose={onCancelar}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-slate-600">
          Por que esse lead foi perdido? Essa informação é obrigatória.
        </p>
        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          required
          rows={3}
          autoFocus
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Confirmar
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
