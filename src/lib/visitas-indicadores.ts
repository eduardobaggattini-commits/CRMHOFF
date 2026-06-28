import type { createClient } from "@/lib/supabase/server";

export const PERIODOS = ["este_mes", "mes_passado", "30_dias", "tudo"] as const;
export type PeriodoIndicadores = (typeof PERIODOS)[number];

export const ROTULO_PERIODO: Record<PeriodoIndicadores, string> = {
  este_mes: "Este mês",
  mes_passado: "Mês passado",
  "30_dias": "Últimos 30 dias",
  tudo: "Todo o período",
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

function calcularIntervalo(periodo: PeriodoIndicadores) {
  const agora = new Date();

  if (periodo === "este_mes") {
    return { inicio: new Date(agora.getFullYear(), agora.getMonth(), 1), fim: null as Date | null };
  }
  if (periodo === "mes_passado") {
    return {
      inicio: new Date(agora.getFullYear(), agora.getMonth() - 1, 1),
      fim: new Date(agora.getFullYear(), agora.getMonth(), 1),
    };
  }
  if (periodo === "30_dias") {
    return { inicio: new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000), fim: null };
  }
  return { inicio: null, fim: null };
}

function rotuloDia(diaIso: string, porMes: boolean) {
  if (porMes) {
    const [ano, mes] = diaIso.split("-");
    return `${mes}/${ano.slice(2)}`;
  }
  const [, mes, dia] = diaIso.split("-");
  return `${dia}/${mes}`;
}

export async function obterIndicadoresVisitas(
  supabase: Supabase,
  opcoes: { periodo: PeriodoIndicadores; vendedorId?: string | null; ehAdmin: boolean },
) {
  const { inicio, fim } = calcularIntervalo(opcoes.periodo);

  // A RLS de "profiles" já devolve só a própria árvore (admin vê todo
  // mundo; gerente/supervisor veem sua equipe; vendedor só vê a si mesmo).
  // Usamos essa lista pra saber quais clientes pertencem à carteira de quem
  // está vendo o painel.
  const { data: equipeRaw } = await supabase.from("profiles").select("id");
  const idsEquipe = (equipeRaw ?? []).map((p) => p.id as string);

  let consultaVisitas = supabase
    .from("visitas")
    .select(
      "id, status, data_hora, client_id, cliente_nome_livre, vendedor_id, cidade_aproximada, latitude, longitude, vendedor:profiles(nome), client:clients(nome, cidade)",
    );

  if (inicio) consultaVisitas = consultaVisitas.gte("data_hora", inicio.toISOString());
  if (fim) consultaVisitas = consultaVisitas.lt("data_hora", fim.toISOString());
  if (opcoes.vendedorId) consultaVisitas = consultaVisitas.eq("vendedor_id", opcoes.vendedorId);

  const { data: visitasRaw } = await consultaVisitas;

  // Cada visita pertence a um único vendedor e, quando ligada à base, a um
  // único cliente; ajustamos o tipo pois não geramos os tipos do banco.
  const visitas = (visitasRaw ?? []) as unknown as Array<{
    id: string;
    status: string;
    data_hora: string;
    client_id: string | null;
    cliente_nome_livre: string | null;
    vendedor_id: string;
    cidade_aproximada: string | null;
    latitude: number | null;
    longitude: number | null;
    vendedor: { nome: string } | null;
    client: { nome: string; cidade: string | null } | null;
  }>;

  const totalVisitas = visitas.length;

  const contagemPorVendedor = new Map<string, { nome: string; total: number }>();
  for (const v of visitas) {
    const atual = contagemPorVendedor.get(v.vendedor_id) ?? { nome: v.vendedor?.nome ?? "—", total: 0 };
    atual.total += 1;
    contagemPorVendedor.set(v.vendedor_id, atual);
  }
  const porVendedor = [...contagemPorVendedor.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const porMes = opcoes.periodo === "tudo";
  const contagemPorDia = new Map<string, number>();
  for (const v of visitas) {
    const chave = porMes ? v.data_hora.slice(0, 7) : v.data_hora.slice(0, 10);
    contagemPorDia.set(chave, (contagemPorDia.get(chave) ?? 0) + 1);
  }
  const evolucao = [...contagemPorDia.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([chave, total]) => ({ rotulo: rotuloDia(porMes ? `${chave}-01` : chave, porMes), total }));

  const contagemStatus = new Map<string, number>();
  for (const v of visitas) {
    contagemStatus.set(v.status, (contagemStatus.get(v.status) ?? 0) + 1);
  }
  const pct = (status: string) =>
    totalVisitas === 0 ? 0 : Math.round(((contagemStatus.get(status) ?? 0) / totalVisitas) * 100);
  const execucao = {
    realizadas: pct("Realizada"),
    clienteAusente: pct("Cliente ausente"),
    canceladas: pct("Cancelada"),
  };

  const clientesUnicosVisitados = new Set<string>();
  const idsClientesVisitados = new Set<string>();
  for (const v of visitas) {
    if (v.client_id) {
      clientesUnicosVisitados.add(`c:${v.client_id}`);
      idsClientesVisitados.add(v.client_id);
    } else if (v.cliente_nome_livre) {
      clientesUnicosVisitados.add(`l:${v.cliente_nome_livre.trim().toLowerCase()}`);
    }
  }

  const contagemPorCidade = new Map<string, number>();
  for (const v of visitas) {
    // Prioriza a cidade identificada pelo GPS na hora da visita; só recorre
    // ao cadastro do cliente se a localização não foi capturada.
    const cidade = v.cidade_aproximada?.trim() || v.client?.cidade?.trim() || "Não identificado";
    contagemPorCidade.set(cidade, (contagemPorCidade.get(cidade) ?? 0) + 1);
  }
  const porCidade = [...contagemPorCidade.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([cidade, total]) => ({ cidade, total }));

  // Pontos do mapa: só as visitas com GPS capturado (as demais não aparecem).
  const pontosMapa = visitas
    .filter((v) => v.latitude !== null && v.longitude !== null)
    .map((v) => ({
      id: v.id,
      latitude: Number(v.latitude),
      longitude: Number(v.longitude),
      cliente: v.client?.nome ?? v.cliente_nome_livre ?? "Cliente não identificado",
      vendedor: v.vendedor?.nome ?? "—",
      dataHora: v.data_hora,
    }));

  // Carteira sem visita: clientes da carteira de quem está vendo (ou de um
  // vendedor específico, se filtrado) que não aparecem entre os visitados.
  let consultaClientes = supabase.from("clients").select("id, nome");
  if (opcoes.vendedorId) {
    consultaClientes = consultaClientes.eq("responsavel_id", opcoes.vendedorId);
  } else if (!opcoes.ehAdmin) {
    consultaClientes = consultaClientes.in("responsavel_id", idsEquipe.length > 0 ? idsEquipe : [""]);
  }
  const { data: clientesRaw } = await consultaClientes;
  const carteiraSemVisita = (clientesRaw ?? []).filter((c) => !idsClientesVisitados.has(c.id));

  // Conversão no pipeline: dos clientes cadastrados que foram visitados,
  // quantos têm negócio em negociação ou fechado no funil.
  let conversaoPipeline: number | null = null;
  if (idsClientesVisitados.size > 0) {
    const { data: dealsRaw } = await supabase
      .from("deals")
      .select("client_id, etapa")
      .in("client_id", [...idsClientesVisitados]);
    const clientesConvertidos = new Set(
      (dealsRaw ?? [])
        .filter((d) => d.etapa === "em_negociacao" || d.etapa === "fechado")
        .map((d) => d.client_id),
    );
    conversaoPipeline = Math.round((clientesConvertidos.size / idsClientesVisitados.size) * 100);
  }

  return {
    totalVisitas,
    clientesUnicos: clientesUnicosVisitados.size,
    execucao,
    porVendedor,
    evolucao,
    porCidade,
    carteiraSemVisita,
    conversaoPipeline,
    pontosMapa,
  };
}
