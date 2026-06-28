import Link from "next/link";
import { AlertTriangle, Megaphone, ArrowRight } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { podeAcompanharEquipe } from "@/lib/perfis";
import { obterResumoVendedor, obterResumoGestor } from "@/lib/home-resumo";
import { obterNovidades, type ItemNovidade } from "@/lib/novidades";
import { CheckIn } from "@/components/visitas/check-in";

type Supabase = Awaited<ReturnType<typeof exigirUsuario>>["supabase"];

const ROTULO_ETAPA_FUNIL: { etapa: string; titulo: string }[] = [
  { etapa: "novo_lead", titulo: "Novo lead" },
  { etapa: "em_negociacao", titulo: "Em negociação" },
];

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function HomePage() {
  const { supabase, user, perfil } = await exigirUsuario();
  const papel = perfil?.role ?? "vendedor";
  const ehAdmin = papel === "admin";
  const ehGestor = podeAcompanharEquipe(papel);

  const { itens: novidades } = await obterNovidades(supabase, user.id, papel);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Olá, {perfil?.nome ?? user.email}</h1>

        {ehGestor ? (
          <HomeGestor supabase={supabase} novidades={novidades} ehAdmin={ehAdmin} />
        ) : (
          <HomeVendedor supabase={supabase} userId={user.id} novidades={novidades} />
        )}
      </div>
    </main>
  );
}

function CartaoResumo({ titulo, valor, href }: { titulo: string; valor: string | number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <p className="text-xs font-medium text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{valor}</p>
    </Link>
  );
}

function CardNovidades({ itens }: { itens: ItemNovidade[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <Megaphone className="h-4 w-4 text-indigo-600" />
        Novidades
      </h3>
      {itens.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma novidade por aqui.</p>
      ) : (
        <ul className="space-y-2">
          {itens.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 text-sm text-slate-700 hover:text-indigo-600"
              >
                <span>{item.texto}</span>
                <ArrowRight className="h-3.5 w-3.5 flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function HomeVendedor({
  supabase,
  userId,
  novidades,
}: {
  supabase: Supabase;
  userId: string;
  novidades: ItemNovidade[];
}) {
  const resumo = await obterResumoVendedor(supabase, userId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <CartaoResumo titulo="Meus leads ativos" valor={resumo.leadsAtivos} href="/pipeline" />
        <CartaoResumo
          titulo="Visitas planejadas hoje"
          valor={resumo.rotaHoje.length}
          href="/visitas?aba=roteiro"
        />
        <CartaoResumo
          titulo="Treinamentos pendentes"
          valor={resumo.treinamentosPendentes}
          href="/meus-treinamentos"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardNovidades itens={novidades} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Minha rota de hoje</h3>
          {resumo.rotaHoje.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhuma visita planejada para hoje.</p>
          ) : (
            <ul className="space-y-3">
              {resumo.rotaHoje.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.cliente}</p>
                    <p className="text-xs text-slate-500">
                      {v.horaPlanejada ? `${v.horaPlanejada.slice(0, 5)} · ` : ""}
                      {v.objetivo}
                    </p>
                  </div>
                  <CheckIn visitaId={v.id} />
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/visitas?aba=roteiro"
            className="mt-3 inline-block text-xs font-medium text-indigo-600 underline"
          >
            Ver roteiro completo
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Meu funil</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <ul className="space-y-1.5 text-sm">
              {ROTULO_ETAPA_FUNIL.map(({ etapa, titulo }) => (
                <li key={etapa} className="flex items-center justify-between">
                  <span className="text-slate-600">{titulo}</span>
                  <span className="font-semibold text-slate-800">{resumo.funilPorEtapa.get(etapa) ?? 0}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center rounded-md bg-emerald-50 p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-emerald-700">Fechado no mês</p>
                <p className="text-xl font-bold text-emerald-800">{formatarValor(resumo.valorFechadoMes)}</p>
              </div>
            </div>
          </div>
          <Link href="/pipeline" className="mt-3 inline-block text-xs font-medium text-indigo-600 underline">
            Ver Pipeline completo
          </Link>
        </div>
      </div>
    </div>
  );
}

async function HomeGestor({
  supabase,
  novidades,
  ehAdmin,
}: {
  supabase: Supabase;
  novidades: ItemNovidade[];
  ehAdmin: boolean;
}) {
  const resumo = await obterResumoGestor(supabase);
  const { alertas } = resumo;
  const temAlerta = alertas.vendedoresSemAtividade.length > 0 || alertas.leadsParados > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CartaoResumo titulo="Visitas realizadas hoje" valor={resumo.visitasHojeEquipe} href="/visitas" />
        <CartaoResumo titulo="Leads ativos da equipe" valor={resumo.leadsAtivosEquipe} href="/pipeline" />
        <CartaoResumo titulo="Carteira sem visita (mês)" valor={resumo.carteiraSemVisita} href="/visitas" />
        <CartaoResumo titulo="Fechados no mês" valor={resumo.fechadosNoMes} href="/pipeline" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardNovidades itens={novidades} />

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Ranking da equipe</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Mais visitas (mês)</p>
              {resumo.rankingVisitas.length === 0 ? (
                <p className="text-xs text-slate-400">Sem dados ainda.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {resumo.rankingVisitas.map((r, i) => (
                    <li key={r.nome} className="flex justify-between text-slate-700">
                      <span>
                        {i + 1}. {r.nome}
                      </span>
                      <span className="font-semibold">{r.total}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Mais fechamentos (mês)</p>
              {resumo.rankingFechamentos.length === 0 ? (
                <p className="text-xs text-slate-400">Sem dados ainda.</p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {resumo.rankingFechamentos.map((r, i) => (
                    <li key={r.nome} className="flex justify-between text-slate-700">
                      <span>
                        {i + 1}. {r.nome}
                      </span>
                      <span className="font-semibold">{r.total}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Alertas</h3>
          {!temAlerta ? (
            <p className="text-sm text-slate-400">Nenhum alerta no momento.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alertas.vendedoresSemAtividade.length > 0 && (
                <li className="flex items-start gap-2 text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  {alertas.vendedoresSemAtividade.length} vendedor(es) sem visita há mais de 7 dias:{" "}
                  {alertas.vendedoresSemAtividade.join(", ")}
                </li>
              )}
              {alertas.leadsParados > 0 && (
                <li className="flex items-start gap-2 text-amber-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <Link href="/pipeline" className="hover:underline">
                    {alertas.leadsParados} lead(s) parados em &quot;Novo lead&quot; há mais de 15 dias
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {ehAdmin && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href="/admin/treinamentos"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Gerenciar treinamentos
          </Link>
          <Link
            href="/usuarios"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Gerenciar usuários
          </Link>
        </div>
      )}
    </div>
  );
}
