import { Award } from "lucide-react";
import { exigirUsuario } from "@/lib/auth";

export default async function DiplomaPage() {
  const { supabase, user } = await exigirUsuario();

  const { data: concluidosRaw } = await supabase
    .from("enrollments")
    .select("id, course:courses(id, titulo)")
    .eq("user_id", user.id)
    .eq("status", "concluido");

  const concluidos = (concluidosRaw ?? []) as unknown as Array<{
    id: string;
    course: { id: string; titulo: string } | null;
  }>;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Diploma</h1>

        {concluidos.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
            Conclua um treinamento para ver seu certificado aqui.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {concluidos.map((c) => (
              <div key={c.id} className="rounded-2xl bg-white p-6 shadow">
                <Award className="h-9 w-9 text-amber-500" strokeWidth={1.5} />
                <p className="mt-3 font-semibold text-slate-800">{c.course?.titulo}</p>
                <p className="mt-1 text-sm text-slate-500">Treinamento concluído</p>
                <p className="mt-3 text-xs text-slate-400">
                  Certificado em PDF chega em breve.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
