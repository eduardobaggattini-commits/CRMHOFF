import { CalendarClock } from "lucide-react";
import { remarcarVisita, cancelarVisitaPlanejada } from "@/app/(app)/visitas/actions";

export function RemarcarForm({ visitaId, dataAtual }: { visitaId: string; dataAtual: string | null }) {
  return (
    <details className="inline-block">
      <summary className="flex cursor-pointer select-none items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <CalendarClock className="h-4 w-4" />
        Remarcar
      </summary>
      <form
        action={remarcarVisita}
        className="absolute z-10 mt-2 w-64 space-y-2 rounded-md border border-slate-200 bg-white p-3 shadow-lg"
      >
        <input type="hidden" name="visitaId" value={visitaId} />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nova data</label>
          <input
            type="date"
            name="novaData"
            defaultValue={dataAtual ?? ""}
            required
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Motivo (opcional)</label>
          <input
            name="nota"
            placeholder="Ex: cliente pediu outro dia"
            className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Confirmar remarcação
        </button>
      </form>
    </details>
  );
}

export function CancelarForm({ visitaId }: { visitaId: string }) {
  return (
    <form action={cancelarVisitaPlanejada}>
      <input type="hidden" name="visitaId" value={visitaId} />
      <button
        type="submit"
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Cancelar
      </button>
    </form>
  );
}
