"use client";

import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PontoMapaVisita } from "./mapa-visitas";

// O Leaflet usa "window"/"document" direto, então não pode ser renderizado
// no servidor — só no navegador, depois que a página já carregou.
const MapaVisitas = dynamic(() => import("./mapa-visitas").then((m) => m.MapaVisitas), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
      Carregando mapa...
    </div>
  ),
});

const CARTAO = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

export function PainelIndicadoresVisitas({
  totalVisitas,
  clientesUnicos,
  execucao,
  porVendedor,
  evolucao,
  porCidade,
  carteiraSemVisita,
  conversaoPipeline,
  pontosMapa,
}: {
  totalVisitas: number;
  clientesUnicos: number;
  execucao: { realizadas: number; clienteAusente: number; canceladas: number };
  porVendedor: { nome: string; total: number }[];
  evolucao: { rotulo: string; total: number }[];
  porCidade: { cidade: string; total: number }[];
  carteiraSemVisita: { id: string; nome: string }[];
  conversaoPipeline: number | null;
  pontosMapa: PontoMapaVisita[];
}) {
  return (
    <div className="mb-8 space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CartaoResumo titulo="Total de visitas" valor={totalVisitas} />
        <CartaoResumo titulo="% Realizadas" valor={`${execucao.realizadas}%`} />
        <CartaoResumo titulo="Clientes únicos" valor={clientesUnicos} />
        <CartaoResumo titulo="Carteira sem visita" valor={carteiraSemVisita.length} />
      </div>

      <div className={CARTAO}>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Mapa de visitas</h3>
        <MapaVisitas pontos={pontosMapa} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={CARTAO}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Visitas por vendedor</h3>
          {porVendedor.length === 0 ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, porVendedor.length * 36)}>
              <BarChart data={porVendedor} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="nome" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={CARTAO}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Evolução das visitas</h3>
          {evolucao.length === 0 ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucao} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#f1f5f9" />
                <XAxis dataKey="rotulo" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={CARTAO}>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Execução</h3>
          <div className="space-y-3">
            <BarraExecucao rotulo="Realizadas" valor={execucao.realizadas} cor="bg-emerald-500" />
            <BarraExecucao rotulo="Cliente ausente" valor={execucao.clienteAusente} cor="bg-amber-500" />
            <BarraExecucao rotulo="Canceladas" valor={execucao.canceladas} cor="bg-red-500" />
          </div>
        </div>

        <div className={CARTAO}>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Visitas por cidade</h3>
          {porCidade.length === 0 ? (
            <SemDados />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, porCidade.length * 32)}>
              <BarChart data={porCidade} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis type="category" dataKey="cidade" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className={CARTAO}>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Conversão no pipeline</h3>
          {conversaoPipeline === null ? (
            <p className="text-sm text-slate-400">Sem clientes visitados no período.</p>
          ) : (
            <p className="text-sm text-slate-600">
              <span className="text-2xl font-bold text-slate-800">{conversaoPipeline}%</span>{" "}
              dos clientes visitados entraram em negociação ou fecharam venda no funil.
            </p>
          )}
        </div>

        <div className={CARTAO}>
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Carteira esquecida</h3>
          {carteiraSemVisita.length === 0 ? (
            <p className="text-sm text-slate-400">Todos os clientes da carteira foram visitados no período.</p>
          ) : (
            <details>
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">
                Ver os {carteiraSemVisita.length} clientes sem visita no período
              </summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm text-slate-600">
                {carteiraSemVisita.map((c) => (
                  <li key={c.id}>{c.nome}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function CartaoResumo({ titulo, valor }: { titulo: string; valor: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{valor}</p>
    </div>
  );
}

function BarraExecucao({ rotulo, valor, cor }: { rotulo: string; valor: number; cor: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{rotulo}</span>
        <span className="font-semibold">{valor}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${cor}`} style={{ width: `${valor}%` }} />
      </div>
    </div>
  );
}

function SemDados() {
  return <p className="py-6 text-center text-sm text-slate-400">Sem dados no período.</p>;
}
