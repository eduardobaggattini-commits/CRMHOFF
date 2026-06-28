import type { createClient } from "@/lib/supabase/server";
import { podeAcompanharEquipe } from "@/lib/perfis";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const AREAS_COM_NOVIDADE = ["tabela_precos", "divulgacao", "treinamentos"] as const;
export type AreaNovidade = (typeof AREAS_COM_NOVIDADE)[number];

export async function marcarAreaVisitada(supabase: Supabase, userId: string, area: AreaNovidade) {
  await supabase
    .from("areas_visitadas")
    .upsert({ user_id: userId, area, visto_em: new Date().toISOString() }, { onConflict: "user_id,area" });
}

async function obterUltimaVisita(supabase: Supabase, userId: string, area: AreaNovidade) {
  const { data } = await supabase
    .from("areas_visitadas")
    .select("visto_em")
    .eq("user_id", userId)
    .eq("area", area)
    .maybeSingle();
  return data?.visto_em ?? null;
}

export type ItemNovidade = { texto: string; href: string };

export async function obterNovidades(
  supabase: Supabase,
  userId: string,
  papel: string | undefined,
): Promise<{ contagemPorArea: Record<AreaNovidade, number>; itens: ItemNovidade[] }> {
  const [vistoPrecos, vistoDivulgacao, vistoTreinamentos] = await Promise.all([
    obterUltimaVisita(supabase, userId, "tabela_precos"),
    obterUltimaVisita(supabase, userId, "divulgacao"),
    obterUltimaVisita(supabase, userId, "treinamentos"),
  ]);

  const itens: ItemNovidade[] = [];
  const contagemPorArea: Record<AreaNovidade, number> = { tabela_precos: 0, divulgacao: 0, treinamentos: 0 };

  // Tabela de Preços: lista cada categoria nova, pelo nome.
  let consultaPrecos = supabase
    .from("price_categories")
    .select("id, nome, created_at")
    .order("created_at", { ascending: false });
  if (vistoPrecos) consultaPrecos = consultaPrecos.gt("created_at", vistoPrecos);
  const { data: categoriasNovas } = await consultaPrecos;
  for (const c of categoriasNovas ?? []) {
    itens.push({ texto: `Nova tabela de preços: ${c.nome}`, href: `/tabela-precos/categoria/${c.id}` });
  }
  contagemPorArea.tabela_precos = categoriasNovas?.length ?? 0;

  // Divulgação: conta materiais novos, sem listar um a um.
  let consultaDivulgacao = supabase.from("divulgacao_files").select("id, created_at");
  if (vistoDivulgacao) consultaDivulgacao = consultaDivulgacao.gt("created_at", vistoDivulgacao);
  const { data: arquivosNovos } = await consultaDivulgacao;
  const totalArquivosNovos = arquivosNovos?.length ?? 0;
  if (totalArquivosNovos > 0) {
    itens.push({
      texto: `${totalArquivosNovos} ${totalArquivosNovos === 1 ? "novo material" : "novos materiais"} em Divulgação`,
      href: "/divulgacao",
    });
  }
  contagemPorArea.divulgacao = totalArquivosNovos;

  // Treinamentos: lista cada curso novo pelo título. A RLS já garante que só
  // aparece o que essa pessoa pode ver (admin vê tudo; os demais, só o que
  // estão matriculados).
  let consultaCursos = supabase
    .from("courses")
    .select("id, titulo, created_at")
    .order("created_at", { ascending: false });
  if (vistoTreinamentos) consultaCursos = consultaCursos.gt("created_at", vistoTreinamentos);
  const { data: cursosNovos } = await consultaCursos;
  const linkTreinamento = podeAcompanharEquipe(papel) ? "/admin/treinamentos" : "/meus-treinamentos";
  for (const c of cursosNovos ?? []) {
    itens.push({ texto: `Novo treinamento: ${c.titulo}`, href: linkTreinamento });
  }
  contagemPorArea.treinamentos = cursosNovos?.length ?? 0;

  return { contagemPorArea, itens };
}
