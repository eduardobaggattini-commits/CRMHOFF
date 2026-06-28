import Link from "next/link";
import { MapPin, AlertTriangle, Clock } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { podeAcompanharEquipe, ehSomenteLeitura } from "@/lib/perfis";
import { obterIndicadoresVisitas, PERIODOS, ROTULO_PERIODO, type PeriodoIndicadores } from "@/lib/visitas-indicadores";
import { PainelIndicadoresVisitas } from "@/components/visitas/painel-indicadores";
import { CriarRoteiroForm } from "@/components/visitas/criar-roteiro-form";
import { CheckIn } from "@/components/visitas/check-in";
import { RemarcarForm, CancelarForm } from "@/components/visitas/remarcar-cancelar";

type Aba = "indicadores" | "visitas" | "roteiro";
type ModoRoteiro = "criar" | "acompanhar";

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{
    vendedor?: string;
    cliente?: string;
    data?: string;
    periodo?: string;
    aba?: string;
    modo?: string;
  }>;
}) {
  const { supabase, perfil, user } = await exigirUsuario();
  const { vendedor, cliente, data, periodo: periodoParam, aba: abaParam, modo: modoParam } = await searchParams;
  const podeFiltrarPorVendedor = podeAcompanharEquipe(perfil?.role);
  const podeRegistrar = !ehSomenteLeitura(perfil?.role);
  const podePlanejarRoteiro = podeFiltrarPorVendedor;
  const periodo: PeriodoIndicadores = (PERIODOS as readonly string[]).includes(periodoParam ?? "")
    ? (periodoParam as PeriodoIndicadores)
    : "este_mes";

  const abaPadrao: Aba = podeFiltrarPorVendedor ? "indicadores" : "visitas";
  const aba: Aba =
    abaParam === "indicadores" || abaParam === "visitas" || abaParam === "roteiro" ? abaParam : abaPadrao;
  const modoRoteiro: ModoRoteiro = modoParam === "criar" ? "criar" : "acompanhar";

  // Mantém os filtros já escolhidos quando a pessoa troca de aba.
  const paramsComuns = new URLSearchParams();
  if (periodo !== "este_mes") paramsComuns.set("periodo", periodo);
  if (vendedor) paramsComuns.set("vendedor", vendedor);
  if (cliente) paramsComuns.set("cliente", cliente);
  if (data) paramsComuns.set("data", data);
  function linkAba(destino: Aba) {
    const sp = new URLSearchParams(paramsComuns);
    sp.set("aba", destino);
    return `/visitas?${sp.toString()}`;
  }

  let vendedores: { id: string; nome: string }[] = [];
  if (podeFiltrarPorVendedor) {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("role", "vendedor")
      .order("nome");
    vendedores = data ?? [];
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Visitas</h1>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <Link
              href={linkAba("indicadores")}
              className={
                aba === "indicadores"
                  ? "rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm"
                  : "rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
              }
            >
              Indicadores
            </Link>
            <Link
              href={linkAba("visitas")}
              className={
                aba === "visitas"
                  ? "rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm"
                  : "rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
              }
            >
              Visitas
            </Link>
            <Link
              href={linkAba("roteiro")}
              className={
                aba === "roteiro"
                  ? "rounded-md bg-white px-4 py-1.5 text-sm font-semibold text-indigo-600 shadow-sm"
                  : "rounded-md px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800"
              }
            >
              Roteiro
            </Link>
          </div>
        </div>

        {aba === "indicadores" && (
          <AbaIndicadores
            supabase={supabase}
            perfil={perfil}
            periodo={periodo}
            vendedor={vendedor}
            vendedores={vendedores}
            podeFiltrarPorVendedor={podeFiltrarPorVendedor}
          />
        )}
        {aba === "visitas" && (
          <AbaVisitas
            supabase={supabase}
            vendedor={vendedor}
            cliente={cliente}
            data={data}
            vendedores={vendedores}
            podeFiltrarPorVendedor={podeFiltrarPorVendedor}
            podeRegistrar={podeRegistrar}
          />
        )}
        {aba === "roteiro" && (
          <AbaRoteiro
            supabase={supabase}
            userId={user.id}
            vendedor={vendedor}
            vendedores={vendedores}
            podePlanejarRoteiro={podePlanejarRoteiro}
            modoRoteiro={modoRoteiro}
          />
        )}
      </div>
    </main>
  );
}

async function AbaIndicadores({
  supabase,
  perfil,
  periodo,
  vendedor,
  vendedores,
  podeFiltrarPorVendedor,
}: {
  supabase: Awaited<ReturnType<typeof exigirUsuario>>["supabase"];
  perfil: Awaited<ReturnType<typeof exigirUsuario>>["perfil"];
  periodo: PeriodoIndicadores;
  vendedor?: string;
  vendedores: { id: string; nome: string }[];
  podeFiltrarPorVendedor: boolean;
}) {
  const indicadores = await obterIndicadoresVisitas(supabase, {
    periodo,
    vendedorId: vendedor || null,
    ehAdmin: perfil?.role === "admin",
  });

  return (
    <>
      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <input type="hidden" name="aba" value="indicadores" />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Período</label>
          <select
            name="periodo"
            defaultValue={periodo}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
          >
            {PERIODOS.map((p) => (
              <option key={p} value={p}>
                {ROTULO_PERIODO[p]}
              </option>
            ))}
          </select>
        </div>
        {podeFiltrarPorVendedor && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Vendedor</label>
            <select
              name="vendedor"
              defaultValue={vendedor ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      <PainelIndicadoresVisitas
        totalVisitas={indicadores.totalVisitas}
        clientesUnicos={indicadores.clientesUnicos}
        execucao={indicadores.execucao}
        porVendedor={indicadores.porVendedor}
        evolucao={indicadores.evolucao}
        porCidade={indicadores.porCidade}
        carteiraSemVisita={indicadores.carteiraSemVisita}
        conversaoPipeline={indicadores.conversaoPipeline}
        pontosMapa={indicadores.pontosMapa}
      />
    </>
  );
}

async function AbaVisitas({
  supabase,
  vendedor,
  cliente,
  data,
  vendedores,
  podeFiltrarPorVendedor,
  podeRegistrar,
}: {
  supabase: Awaited<ReturnType<typeof exigirUsuario>>["supabase"];
  vendedor?: string;
  cliente?: string;
  data?: string;
  vendedores: { id: string; nome: string }[];
  podeFiltrarPorVendedor: boolean;
  podeRegistrar: boolean;
}) {
  let consulta = supabase
    .from("visitas")
    .select(
      "id, objetivo, status, data_hora, endereco_aproximado, cliente_nome_livre, client:clients(nome), vendedor:profiles(nome)",
    )
    // Visitas planejadas que ainda não tiveram check-in vivem na aba
    // "Roteiro"; aqui só entram visitas avulsas ou já com resultado.
    .or("data_planejada.is.null,data_hora.not.is.null")
    .order("data_hora", { ascending: false });

  // A trava de quem vê o quê já é feita pelo banco (RLS); aqui só filtramos
  // por um vendedor específico quando alguém escolhe no seletor.
  if (vendedor) {
    consulta = consulta.eq("vendedor_id", vendedor);
  }

  if (data) {
    consulta = consulta.gte("data_hora", `${data}T00:00:00`).lte("data_hora", `${data}T23:59:59`);
  }

  const { data: visitasRaw } = await consulta;

  // Cada visita pertence a um único cliente e vendedor; ajustamos o tipo pois
  // não geramos os tipos do banco (isso exigiria a senha do banco de dados).
  let visitas = (visitasRaw ?? []) as unknown as Array<{
    id: string;
    objetivo: string;
    status: string;
    data_hora: string;
    endereco_aproximado: string | null;
    cliente_nome_livre: string | null;
    client: { nome: string } | null;
    vendedor: { nome: string } | null;
  }>;

  if (cliente) {
    const termo = cliente.toLowerCase();
    visitas = visitas.filter((v) =>
      (v.client?.nome ?? v.cliente_nome_livre ?? "").toLowerCase().includes(termo),
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-end">
        {podeRegistrar && (
          <Link
            href="/visitas/nova"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Registrar visita
          </Link>
        )}
      </div>

      <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
        <input type="hidden" name="aba" value="visitas" />
        {podeFiltrarPorVendedor && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Vendedor</label>
            <select
              name="vendedor"
              defaultValue={vendedor ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Cliente</label>
          <input
            name="cliente"
            defaultValue={cliente ?? ""}
            placeholder="Nome do cliente"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Data</label>
          <input
            type="date"
            name="data"
            defaultValue={data ?? ""}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-2xl bg-white shadow">
        {visitas.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">Nenhuma visita registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {visitas.map((v) => (
              <li key={v.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800">
                    {v.client?.nome ?? v.cliente_nome_livre} — {v.objetivo} — {v.status}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(v.data_hora).toLocaleString("pt-BR")}
                  </p>
                </div>
                {podeFiltrarPorVendedor && v.vendedor && (
                  <p className="text-xs text-slate-400">Vendedor: {v.vendedor.nome}</p>
                )}
                {v.endereco_aproximado ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {v.endereco_aproximado}
                  </p>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Sem localização registrada
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function SubAbasRoteiro({ modoAtual }: { modoAtual: ModoRoteiro }) {
  return (
    <div className="mb-4 flex gap-4 border-b border-slate-200 text-sm">
      <Link
        href="/visitas?aba=roteiro&modo=acompanhar"
        className={`-mb-px border-b-2 px-1 py-2 font-medium ${
          modoAtual === "acompanhar"
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Acompanhamento
      </Link>
      <Link
        href="/visitas?aba=roteiro&modo=criar"
        className={`-mb-px border-b-2 px-1 py-2 font-medium ${
          modoAtual === "criar"
            ? "border-indigo-600 text-indigo-600"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        + Criar roteiro
      </Link>
    </div>
  );
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

async function AbaRoteiro({
  supabase,
  userId,
  vendedor,
  vendedores,
  podePlanejarRoteiro,
  modoRoteiro,
}: {
  supabase: Awaited<ReturnType<typeof exigirUsuario>>["supabase"];
  userId: string;
  vendedor?: string;
  vendedores: { id: string; nome: string }[];
  podePlanejarRoteiro: boolean;
  modoRoteiro: ModoRoteiro;
}) {
  if (podePlanejarRoteiro && modoRoteiro === "criar") {
    const { data: clientesRaw } = await supabase.from("clients").select("id, nome").order("nome");

    return (
      <>
        <SubAbasRoteiro modoAtual="criar" />
        <CriarRoteiroForm vendedores={vendedores} clientes={clientesRaw ?? []} />
      </>
    );
  }

  let consulta = supabase
    .from("visitas")
    .select(
      "id, objetivo, status, data_planejada, hora_planejada, data_hora, observacao, cliente_nome_livre, client:clients(nome), vendedor:profiles(nome), vendedor_id",
    )
    .not("data_planejada", "is", null)
    .order("data_planejada", { ascending: true });

  if (vendedor) {
    consulta = consulta.eq("vendedor_id", vendedor);
  }

  if (!podePlanejarRoteiro) {
    // Agenda do próprio vendedor: só o que ainda está pendente de check-in
    // (o que já foi resolvido passa a aparecer como visita normal na aba
    // "Visitas").
    consulta = consulta.is("data_hora", null);
  }

  const { data: itensRaw } = await consulta;

  // Cada item de roteiro pertence a um único vendedor e, opcionalmente, a um
  // cliente cadastrado; ajustamos o tipo pois não geramos os tipos do banco.
  const itens = (itensRaw ?? []) as unknown as Array<{
    id: string;
    objetivo: string;
    status: string;
    data_planejada: string;
    hora_planejada: string | null;
    data_hora: string | null;
    observacao: string | null;
    cliente_nome_livre: string | null;
    client: { nome: string } | null;
    vendedor: { nome: string } | null;
    vendedor_id: string;
  }>;

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <>
      {podePlanejarRoteiro && <SubAbasRoteiro modoAtual="acompanhar" />}

      {podePlanejarRoteiro && (
        <form method="get" className="mb-6 flex flex-wrap items-end gap-2">
          <input type="hidden" name="aba" value="roteiro" />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Vendedor</label>
            <select
              name="vendedor"
              defaultValue={vendedor ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
            >
              <option value="">Todos</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nome}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Filtrar
          </button>
        </form>
      )}

      <div className="rounded-2xl bg-white shadow">
        {itens.length === 0 ? (
          <p className="px-6 py-6 text-sm text-slate-500">
            {podePlanejarRoteiro ? "Nenhuma visita planejada ainda." : "Você não tem visitas planejadas no momento."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {itens.map((item) => {
              const pendente = item.status === "Agendada" && !item.data_hora;
              const atrasada = pendente && item.data_planejada < hoje;
              const souEu = item.vendedor_id === userId;

              return (
                <li key={item.id} className={`px-6 py-4 ${atrasada ? "bg-red-50" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {item.client?.nome ?? item.cliente_nome_livre} — {item.objetivo}
                      </p>
                      <p
                        className={`mt-0.5 flex items-center gap-1.5 text-sm ${
                          atrasada ? "font-semibold text-red-600" : "text-slate-500"
                        }`}
                      >
                        {atrasada ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {pendente
                          ? `Planejada para ${formatarData(item.data_planejada)}${
                              item.hora_planejada ? ` às ${item.hora_planejada.slice(0, 5)}` : ""
                            }${atrasada ? " (atrasada)" : ""}`
                          : item.data_hora
                            ? `${item.status} em ${new Date(item.data_hora).toLocaleDateString("pt-BR")}`
                            : item.status}
                      </p>
                      {podePlanejarRoteiro && item.vendedor && (
                        <p className="text-xs text-slate-400">Vendedor: {item.vendedor.nome}</p>
                      )}
                      {item.observacao && (
                        <p className="mt-1 whitespace-pre-line text-xs text-slate-500">{item.observacao}</p>
                      )}
                    </div>
                    {pendente && (
                      <div className="flex flex-wrap items-center gap-2">
                        {souEu && <CheckIn visitaId={item.id} />}
                        <RemarcarForm visitaId={item.id} dataAtual={item.data_planejada} />
                        {podePlanejarRoteiro && <CancelarForm visitaId={item.id} />}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
