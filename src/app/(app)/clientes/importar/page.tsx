import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { ImportarForm } from "@/components/clientes/importar-form";

export default async function ImportarClientesPage() {
  await exigirAdmin();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Importar clientes</h1>
          <Link href="/clientes" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        <ImportarForm />
      </div>
    </main>
  );
}
