import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { ImportarLeadsForm } from "@/components/pipeline/importar-leads-form";

export default async function ImportarLeadsPage() {
  await exigirAdmin();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Importar leads para o Pipeline</h1>
          <Link href="/pipeline" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        <ImportarLeadsForm />
      </div>
    </main>
  );
}
