import { Target, ArrowUpRight } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";

const URL_METAS = "https://hoff.salesgrid.cloud/goal-manager";

export default async function MetasPage() {
  await exigirUsuario();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">SalesGrid / Metas</h1>

        <div className="flex flex-col items-center rounded-2xl bg-white p-10 text-center shadow">
          <Target className="mb-4 h-10 w-10 text-indigo-600" />
          <p className="mb-1 text-sm text-slate-600">
            Essa ferramenta abre numa aba separada do navegador, porque o site de Metas não permite ser exibido
            dentro de outros sites.
          </p>
          <p className="mb-6 text-sm text-slate-500">Faça login normalmente na aba que abrir.</p>
          <a
            href={URL_METAS}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Abrir Metas
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}
