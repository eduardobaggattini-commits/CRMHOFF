import Link from "next/link";
import { Upload, Download } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";
import { criarCliente, removerCliente } from "./actions";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase, perfil } = await exigirUsuario();
  const { q } = await searchParams;
  const ehAdmin = perfil?.role === "admin";

  let consulta = supabase
    .from("clients")
    .select("id, nome, empresa, documento, telefone, email, cidade, estado, responsavel:profiles(nome)")
    .order("nome");

  if (q) {
    consulta = consulta.or(
      `nome.ilike.%${q}%,empresa.ilike.%${q}%,documento.ilike.%${q}%,telefone.ilike.%${q}%`,
    );
  }

  const { data: clientesRaw } = await consulta;

  // Cada cliente tem um único vendedor responsável (ou nenhum); ajustamos o
  // tipo pois não geramos os tipos do banco (isso exigiria a senha do banco).
  const clientes = (clientesRaw ?? []) as unknown as Array<{
    id: string;
    nome: string;
    empresa: string | null;
    documento: string | null;
    telefone: string | null;
    email: string | null;
    cidade: string | null;
    estado: string | null;
    responsavel: { nome: string } | null;
  }>;

  let vendedores: { id: string; nome: string }[] = [];
  if (ehAdmin) {
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
          <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
          {ehAdmin && (
            <div className="flex items-center gap-2">
              <a
                href="/clientes/importar/modelo"
                className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Baixar modelo
              </a>
              <Link
                href="/clientes/importar"
                className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Upload className="h-4 w-4" />
                Importar planilha
              </Link>
            </div>
          )}
        </div>

        <form action="/clientes" className="mb-6">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nome, empresa, documento ou telefone..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </form>

        {ehAdmin && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Novo cliente</h2>
            <form action={criarCliente} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome / Razão social
                </label>
                <input
                  name="nome"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Empresa (opcional)
                </label>
                <input
                  name="empresa"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  CNPJ ou CPF
                </label>
                <input
                  name="documento"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Telefone / WhatsApp
                </label>
                <input
                  name="telefone"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
                <input
                  name="email"
                  type="email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Vendedor responsável
                </label>
                <select
                  name="responsavel_id"
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
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Estado</label>
                <input
                  name="estado"
                  maxLength={2}
                  placeholder="Ex: SP"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Endereço</label>
                <input
                  name="endereco"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="sm:col-span-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Cadastrar cliente
              </button>
            </form>
          </div>
        )}

        <div className="rounded-2xl bg-white shadow">
          <h2 className="border-b border-slate-100 px-6 py-4 text-lg font-semibold text-slate-800">
            Lista de clientes
          </h2>
          {clientes.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">Nenhum cliente encontrado.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {clientes.map((cliente) => (
                <li key={cliente.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-800">{cliente.nome}</p>
                    <p className="text-sm text-slate-500">
                      {[
                        cliente.empresa,
                        cliente.documento,
                        cliente.telefone,
                        [cliente.cidade, cliente.estado].filter(Boolean).join("/"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Vendedor: {cliente.responsavel?.nome ?? "Sem vendedor atribuído"}
                    </p>
                  </div>
                  {ehAdmin && (
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/clientes/${cliente.id}/editar`}
                        className="text-sm font-medium text-indigo-600 underline hover:text-indigo-700"
                      >
                        Editar
                      </Link>
                      <form action={removerCliente}>
                        <input type="hidden" name="clientId" value={cliente.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-red-600 underline"
                        >
                          Remover
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
