import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { ComparacaoForm } from "@/components/shopping-preco/comparacao-form";

export default async function ComparacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await exigirUsuario();

  const { data: comparacao } = await supabase
    .from("price_comparisons")
    .select("id, produto, preco_hoff, price_comparison_competitors(id, nome, preco)")
    .eq("id", id)
    .single();

  if (!comparacao) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-600">Comparação não encontrada.</p>
          <Link
            href="/shopping-de-preco"
            className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return <ComparacaoForm comparacaoInicial={comparacao} />;
}
