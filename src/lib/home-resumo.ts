import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const ETAPAS_ATIVAS = ["novo_lead", "em_negociacao"];

function inicioMesIso() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();
}

function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function isoMenosDias(dias: number) {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
}

export async function obterResumoVendedor(supabase: Supabase, userId: string) {
  const hoje = hojeIso();
  const desdeInicioMes = inicioMesIso();

  const [dealsRes, visitasHojeRes, enrollmentsRes] = await Promise.all([
    supabase.from("deals").select("id, etapa, valor, fechado_em").eq("responsavel_id", userId),
    supabase
      .from("visitas")
      .select("id, objetivo, data_planejada, hora_planejada, client:clients(nome), cliente_nome_livre")
      .eq("vendedor_id", userId)
      .eq("data_planejada", hoje)
      .is("data_hora", null)
      .order("hora_planejada", { ascending: true, nullsFirst: false }),
    supabase.from("enrollments").select("id, status").eq("user_id", userId),
  ]);

  const deals = dealsRes.data ?? [];
  const leadsAtivos = deals.filter((d) => ETAPAS_ATIVAS.includes(d.etapa)).length;
  const valorFechadoMes = deals
    .filter((d) => d.etapa === "fechado" && d.fechado_em && d.fechado_em >= desdeInicioMes)
    .reduce((soma, d) => soma + (d.valor ?? 0), 0);

  const contagemPorEtapa = new Map<string, number>();
  for (const d of deals) {
    contagemPorEtapa.set(d.etapa, (contagemPorEtapa.get(d.etapa) ?? 0) + 1);
  }

  // Cada visita planejada pertence a um único cliente (ou nome livre);
  // ajustamos o tipo pois não geramos os tipos do banco.
  const visitasHoje = (visitasHojeRes.data ?? []) as unknown as Array<{
    id: string;
    objetivo: string;
    data_planejada: string;
    hora_planejada: string | null;
    client: { nome: string } | null;
    cliente_nome_livre: string | null;
  }>;

  const enrollments = enrollmentsRes.data ?? [];
  const treinamentosPendentes = enrollments.filter((e) => e.status !== "concluido").length;

  return {
    leadsAtivos,
    treinamentosPendentes,
    valorFechadoMes,
    funilPorEtapa: contagemPorEtapa,
    rotaHoje: visitasHoje.map((v) => ({
      id: v.id,
      cliente: v.client?.nome ?? v.cliente_nome_livre ?? "Cliente não identificado",
      objetivo: v.objetivo,
      horaPlanejada: v.hora_planejada,
    })),
  };
}

export async function obterResumoGestor(supabase: Supabase) {
  const hoje = hojeIso();
  const desdeInicioMes = inicioMesIso();
  const ha7Dias = isoMenosDias(7);
  const ha15Dias = isoMenosDias(15);

  const { data: vendedoresRaw } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("role", "vendedor")
    .order("nome");
  const vendedores = vendedoresRaw ?? [];
  const idsVendedores = vendedores.map((v) => v.id);
  const nomePorId = new Map(vendedores.map((v) => [v.id, v.nome]));

  // deals/visitas já vêm filtrados pela árvore de quem está vendo (RLS em
  // cascata); só "clients" precisa de filtro manual, porque todo mundo
  // logado pode ler a base inteira de clientes.
  const [dealsRes, visitasMesRes, visitas7DiasRes, clientesRes] = await Promise.all([
    supabase.from("deals").select("id, etapa, responsavel_id, created_at, fechado_em"),
    supabase.from("visitas").select("id, status, data_hora, vendedor_id, client_id").gte("data_hora", desdeInicioMes),
    supabase.from("visitas").select("vendedor_id").gte("data_hora", ha7Dias),
    supabase
      .from("clients")
      .select("id, responsavel_id")
      .in("responsavel_id", idsVendedores.length > 0 ? idsVendedores : [""]),
  ]);

  const deals = dealsRes.data ?? [];
  const leadsAtivosEquipe = deals.filter((d) => ETAPAS_ATIVAS.includes(d.etapa)).length;
  const fechadosNoMes = deals.filter((d) => d.etapa === "fechado" && d.fechado_em && d.fechado_em >= desdeInicioMes);
  const leadsParados = deals.filter((d) => d.etapa === "novo_lead" && d.created_at <= ha15Dias).length;

  const visitasMes = visitasMesRes.data ?? [];
  const visitasHojeEquipe = visitasMes.filter(
    (v) => v.status === "Realizada" && v.data_hora && v.data_hora.slice(0, 10) === hoje,
  ).length;

  const idsClientesVisitadosMes = new Set(
    visitasMes.filter((v) => v.client_id).map((v) => v.client_id as string),
  );
  const clientesDaCarteira = clientesRes.data ?? [];
  const carteiraSemVisita = clientesDaCarteira.filter((c) => !idsClientesVisitadosMes.has(c.id)).length;

  const contagemVisitasPorVendedor = new Map<string, number>();
  for (const v of visitasMes) {
    if (v.status === "Realizada") {
      contagemVisitasPorVendedor.set(v.vendedor_id, (contagemVisitasPorVendedor.get(v.vendedor_id) ?? 0) + 1);
    }
  }
  const rankingVisitas = [...contagemVisitasPorVendedor.entries()]
    .filter(([id]) => nomePorId.has(id))
    .map(([id, total]) => ({ nome: nomePorId.get(id)!, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const contagemFechamentosPorVendedor = new Map<string, number>();
  for (const d of fechadosNoMes) {
    contagemFechamentosPorVendedor.set(d.responsavel_id, (contagemFechamentosPorVendedor.get(d.responsavel_id) ?? 0) + 1);
  }
  const rankingFechamentos = [...contagemFechamentosPorVendedor.entries()]
    .filter(([id]) => nomePorId.has(id))
    .map(([id, total]) => ({ nome: nomePorId.get(id)!, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const idsComAtividade7d = new Set((visitas7DiasRes.data ?? []).map((v) => v.vendedor_id));
  const vendedoresSemAtividade = vendedores.filter((v) => !idsComAtividade7d.has(v.id)).map((v) => v.nome);

  return {
    visitasHojeEquipe,
    leadsAtivosEquipe,
    carteiraSemVisita,
    fechadosNoMes: fechadosNoMes.length,
    rankingVisitas,
    rankingFechamentos,
    alertas: { vendedoresSemAtividade, leadsParados },
  };
}
