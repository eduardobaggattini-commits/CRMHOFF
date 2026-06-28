import Link from "next/link";
import { Trophy } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";

function formatarValor(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ShoppingDePrecoPage() {
  const { supabase } = await exigirUsuario();

  const { data: comparacoesRaw } = await supabase
    .from("price_comparisons")
    .select("id, produto, preco_hoff, created_at, price_comparison_competitors(nome, preco)")
    .order("created_at", { ascending: false });

  // Cada comparação tem vários concorrentes; ajustamos o tipo pois não
  // geramos os tipos do banco (isso exigiria a senha do banco de dados).
  const comparacoes = (comparacoesRaw ?? []) as unknown as Array<{
    id: string;
    produto: string;
    preco_hoff: number;
    created_at: string;
    price_comparison_competitors: { nome: string; preco: number }[];
  }>;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Shopping de Preço</h1>
          <Link
            href="/shopping-de-preco/nova"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            + Nova comparação
          </Link>
        </div>

        {comparacoes.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
            Nenhuma comparação salva ainda.
          </div>
        ) : (
          <ul className="space-y-3">
            {comparacoes.map((c) => {
              const todos = [
                { nome: "Hoff", preco: c.preco_hoff },
                ...c.price_comparison_competitors,
              ];
              const maisBarato = todos.reduce(
                (min, item) => (item.preco < min.preco ? item : min),
                todos[0],
              );
              return (
                <li key={c.id} className="rounded-2xl bg-white p-5 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{c.produto}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        Hoff: {formatarValor(c.preco_hoff)} ·{" "}
                        {maisBarato.nome === "Hoff" ? (
                          <span className="flex items-center gap-1 font-medium text-amber-700">
                            <Trophy className="h-3.5 w-3.5" />
                            Hoff é a mais barata
                          </span>
                        ) : (
                          <>
                            Mais barato: {maisBarato.nome} ({formatarValor(maisBarato.preco)})
                          </>
                        )}
                      </p>
                    </div>
                    <Link
                      href={`/shopping-de-preco/${c.id}`}
                      className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
