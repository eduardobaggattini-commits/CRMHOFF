import Link from "next/link";
import { exigirUsuario } from "@/lib/auth";
import { RegistrarVisitaForm } from "@/components/visitas/registrar-form";

export default async function NovaVisitaPage() {
  const { supabase } = await exigirUsuario();

  const { data: clientesRaw } = await supabase.from("clients").select("id, nome").order("nome");
  const clientes = clientesRaw ?? [];

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Nova visita</h1>
          <Link href="/visitas" className="text-sm font-medium text-slate-600 underline">
            Voltar
          </Link>
        </div>

        <RegistrarVisitaForm clientes={clientes} />
      </div>
    </main>
  );
}
