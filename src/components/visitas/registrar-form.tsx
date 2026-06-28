"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { registrarVisita, obterEndereco } from "@/app/(app)/visitas/actions";
import { OBJETIVOS_VISITA as OBJETIVOS, STATUS_VISITA } from "@/lib/visitas-constantes";

type EstadoLocalizacao =
  | { tipo: "ocioso" }
  | { tipo: "capturando" }
  | { tipo: "sucesso"; latitude: number; longitude: number; endereco: string | null; cidade: string | null }
  | { tipo: "erro"; mensagem: string };

export function RegistrarVisitaForm({
  clientes,
}: {
  clientes: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [textoCliente, setTextoCliente] = useState("");
  const [clientIdSelecionado, setClientIdSelecionado] = useState<string | null>(null);
  const [objetivo, setObjetivo] = useState(OBJETIVOS[0]);
  const [status, setStatus] = useState(STATUS_VISITA[2]);
  const [localizacao, setLocalizacao] = useState<EstadoLocalizacao>({ tipo: "ocioso" });
  const [salvando, setSalvando] = useState(false);

  function handleTextoCliente(valor: string) {
    setTextoCliente(valor);
    const correspondencia = clientes.find(
      (c) => c.nome.toLowerCase() === valor.trim().toLowerCase(),
    );
    setClientIdSelecionado(correspondencia?.id ?? null);
  }

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
          mensagem:
            "Não foi possível obter sua localização (permissão negada ou site sem HTTPS). A visita será salva sem localização.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  // Pede a localização assim que a tela abre, sem esperar clique — só cai
  // de volta no botão manual se a captura automática falhar.
  useEffect(() => {
    capturarLocalizacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!textoCliente.trim()) return;

    setSalvando(true);
    await registrarVisita({
      clientId: clientIdSelecionado,
      clienteNomeLivre: textoCliente.trim(),
      objetivo,
      status,
      latitude: localizacao.tipo === "sucesso" ? localizacao.latitude : null,
      longitude: localizacao.tipo === "sucesso" ? localizacao.longitude : null,
      enderecoAproximado: localizacao.tipo === "sucesso" ? localizacao.endereco : null,
      cidadeAproximada: localizacao.tipo === "sucesso" ? localizacao.cidade : null,
    });
    setSalvando(false);
    router.push("/visitas");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl bg-white p-6 shadow">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Cliente</label>
        <input
          value={textoCliente}
          onChange={(e) => handleTextoCliente(e.target.value)}
          list="lista-clientes"
          placeholder="Busque um cliente cadastrado ou digite o nome"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
        <datalist id="lista-clientes">
          {clientes.map((c) => (
            <option key={c.id} value={c.nome} />
          ))}
        </datalist>
        <p className="mt-1 text-xs text-slate-400">
          {clientIdSelecionado
            ? "Cliente encontrado na base."
            : "Cliente não cadastrado — será registrado só nesta visita."}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Objetivo da visita
        </label>
        <select
          value={objetivo}
          onChange={(e) => setObjetivo(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {OBJETIVOS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {STATUS_VISITA.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
        Data: {new Date().toLocaleString("pt-BR")} (automático)
      </div>

      <div>
        <p className="mb-1 text-sm font-medium text-slate-700">Localização</p>
        {localizacao.tipo === "ocioso" && (
          <button
            type="button"
            onClick={capturarLocalizacao}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4" />
            Capturar localização
          </button>
        )}
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
              className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4" />
              Tentar capturar novamente
            </button>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {salvando ? "Salvando..." : "Salvar visita"}
      </button>
    </form>
  );
}
