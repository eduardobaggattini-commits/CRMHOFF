import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { atualizarCliente } from "../../actions";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();

  const { data: cliente } = await supabase
    .from("clients")
    .select(
      "id, nome, empresa, documento, telefone, email, cidade, estado, endereco, observacoes, responsavel_id",
    )
    .eq("id", id)
    .single();

  const { data: vendedoresRaw } = await supabase
    .from("profiles")
    .select("id, nome")
    .eq("role", "vendedor")
    .order("nome");
  const vendedores = vendedoresRaw ?? [];

  if (!cliente) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-600">Cliente não encontrado.</p>
          <Link
            href="/clientes"
            className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Editar cliente</h1>
          <Link href="/clientes" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <form action={atualizarCliente} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="clientId" value={cliente.id} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome / Razão social
              </label>
              <input
                name="nome"
                defaultValue={cliente.nome}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Empresa</label>
              <input
                name="empresa"
                defaultValue={cliente.empresa ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                CNPJ ou CPF
              </label>
              <input
                name="documento"
                defaultValue={cliente.documento ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Telefone / WhatsApp
              </label>
              <input
                name="telefone"
                defaultValue={cliente.telefone ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
              <input
                name="email"
                type="email"
                defaultValue={cliente.email ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Vendedor responsável
              </label>
              <select
                name="responsavel_id"
                defaultValue={cliente.responsavel_id ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Sem vendedor atribuído</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cidade</label>
              <input
                name="cidade"
                defaultValue={cliente.cidade ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
              <input
                name="estado"
                maxLength={2}
                defaultValue={cliente.estado ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Endereço</label>
              <input
                name="endereco"
                defaultValue={cliente.endereco ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Observações
              </label>
              <textarea
                name="observacoes"
                rows={3}
                defaultValue={cliente.observacoes ?? ""}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="sm:col-span-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Salvar alterações
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
