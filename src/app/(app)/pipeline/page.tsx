import Link from "next/link";
import { Upload } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { podeAcompanharEquipe, ehSomenteLeitura } from "@/lib/perfis";
import { PipelineBoard } from "@/components/pipeline/board";
import { ORIGENS_LEAD } from "@/components/pipeline/types";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ vendedor?: string; origem?: string }>;
}) {
  const { supabase, perfil } = await exigirUsuario();
  const { vendedor, origem } = await searchParams;
  const ehAdmin = perfil?.role === "admin";
  const podeFiltrarPorVendedor = podeAcompanharEquipe(perfil?.role);
  const somenteLeitura = ehSomenteLeitura(perfil?.role);

  let consulta = supabase
    .from("deals")
    .select(
      "id, produto, valor, etapa, motivo_perda, origem_lead, cliente_nome_livre, cliente_telefone_livre, client:clients(id, nome, telefone)",
    )
    .order("created_at", { ascending: false });

  // A trava de quem vê o quê já é feita pelo banco (RLS); aqui só filtramos
  // por um vendedor específico quando alguém escolhe no seletor.
  if (vendedor) {
    consulta = consulta.eq("responsavel_id", vendedor);
  }

  if (origem) {
    consulta = consulta.eq("origem_lead", origem);
  }

  const { data: dealsRaw } = await consulta;

  // Cada negócio pertence a um único cliente (ou nome digitado); ajustamos o
  // tipo pois não geramos os tipos do banco (isso exigiria a senha do banco).
  const deals = (dealsRaw ?? []) as unknown as Array<{
    id: string;
    produto: string;
    valor: number | null;
    etapa: string;
    motivo_perda: string | null;
    origem_lead: string | null;
    cliente_nome_livre: string | null;
    cliente_telefone_livre: string | null;
    client: { id: string; nome: string; telefone: string | null } | null;
  }>;

  let vendedores: { id: string; nome: string }[] = [];
  if (podeFiltrarPorVendedor) {
    const { data } = await supabase
      .from("profiles")
      .select("id, nome")
      .eq("role", "vendedor")
      .order("nome");
    vendedores = data ?? [];
  }

  const { data: clientesRaw } = await supabase
    .from("clients")
    .select("id, nome, telefone")
    .order("nome");
  const clientes = clientesRaw ?? [];

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Pipeline</h1>

          {ehAdmin && (
            <Link
              href="/pipeline/importar"
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" />
              Importar leads
            </Link>
          )}
        </div>

        <div className="mb-6 flex items-center justify-end">
          <form method="get" className="flex items-center gap-2">
            <label htmlFor="origem" className="text-sm text-slate-600">
              Origem:
            </label>
            <select
              id="origem"
              name="origem"
              defaultValue={origem ?? ""}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700"
            >
              <option value="">Todas</option>
              {ORIGENS_LEAD.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            {podeFiltrarPorVendedor && (
              <>
                <label htmlFor="vendedor" className="text-sm text-slate-600">
                  Vendedor:
                </label>
                <select
                  id="vendedor"
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
              </>
            )}

            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Filtrar
            </button>
          </form>
        </div>

        <PipelineBoard dealsIniciais={deals} clientes={clientes} somenteLeitura={somenteLeitura} />
      </div>
    </main>
  );
}
