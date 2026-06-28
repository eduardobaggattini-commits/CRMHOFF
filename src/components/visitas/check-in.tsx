"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { confirmarCheckIn, obterEndereco } from "@/app/(app)/visitas/actions";
import { RESULTADOS_CHECKIN } from "@/lib/visitas-constantes";

type EstadoLocalizacao =
  | { tipo: "ocioso" }
  | { tipo: "capturando" }
  | { tipo: "sucesso"; latitude: number; longitude: number; endereco: string | null; cidade: string | null }
  | { tipo: "erro"; mensagem: string };

export function CheckIn({ visitaId }: { visitaId: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [status, setStatus] = useState(RESULTADOS_CHECKIN[0]);
  const [observacao, setObservacao] = useState("");
  const [localizacao, setLocalizacao] = useState<EstadoLocalizacao>({ tipo: "ocioso" });
  const [salvando, setSalvando] = useState(false);

  function capturarLocalizacao() {
    if (!navigator.geolocation) {
      setLocalizacao({ tipo: "erro", mensagem: "Esse navegador não suporta localização." });
      return;
    }

    setLocalizacao({ tipo: "capturando" });
    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        const { latitude, longitude } = posicao.coords;
        const { enderecoCompleto, cidade } = await obterEndereco(latitude, longitude);
        setLocalizacao({ tipo: "sucesso", latitude, longitude, endereco: enderecoCompleto, cidade });
      },
      () => {
        setLocalizacao({
          tipo: "erro",
          mensagem: "Não foi possível obter sua localização (permissão negada ou site sem HTTPS).",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  useEffect(() => {
    if (aberto) capturarLocalizacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    await confirmarCheckIn({
      visitaId,
      status,
      observacao,
      latitude: localizacao.tipo === "sucesso" ? localizacao.latitude : null,
      longitude: localizacao.tipo === "sucesso" ? localizacao.longitude : null,
      enderecoAproximado: localizacao.tipo === "sucesso" ? localizacao.endereco : null,
      cidadeAproximada: localizacao.tipo === "sucesso" ? localizacao.cidade : null,
    });
    setSalvando(false);
    router.refresh();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Fazer check-in
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 w-full space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Localização</label>
        {localizacao.tipo === "capturando" && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Obtendo localização...
          </p>
        )}
        {localizacao.tipo === "sucesso" && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            {localizacao.endereco ?? `${localizacao.latitude}, ${localizacao.longitude}`}
          </p>
        )}
        {localizacao.tipo === "erro" && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              {localizacao.mensagem}
            </p>
            <button
              type="button"
              onClick={capturarLocalizacao}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              Tentar capturar novamente
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Resultado</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {RESULTADOS_CHECKIN.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Observação (opcional)</label>
        <textarea
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Confirmar check-in"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
