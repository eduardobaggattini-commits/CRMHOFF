"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizarNomeArquivo } from "@/lib/storage";

// Mesma ideia do UploadDiretoForm: sobe direto pro Storage e só manda o
// caminho final pra Server Action trocar o registro no banco.
export function SubstituirDiretoForm({
  bucket,
  categoryId,
  accept,
  acaoConcluir,
}: {
  bucket: string;
  categoryId: string;
  accept?: string;
  acaoConcluir: (arquivo: { nomeArquivo: string; arquivoPath: string }) => Promise<void>;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("arquivo") as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    setEnviando(true);
    const supabase = createClient();
    const caminho = `${categoryId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(arquivo.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo);

    if (!error) {
      await acaoConcluir({ nomeArquivo: arquivo.name, arquivoPath: caminho });
      router.refresh();
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-1">
      <input
        name="arquivo"
        type="file"
        accept={accept}
        required
        disabled={enviando}
        className="w-full text-xs text-slate-600"
      />
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Substituir"}
      </button>
    </form>
  );
}
