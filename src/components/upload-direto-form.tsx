"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sanitizarNomeArquivo } from "@/lib/storage";

// Sobe o arquivo direto do navegador pro Supabase Storage (sem passar pelo
// servidor da Vercel, que travaria em 4,5MB); só o caminho final é mandado
// pra Server Action, que aí sim grava a linha no banco.
export function UploadDiretoForm({
  bucket,
  categoryId,
  accept,
  multiple = true,
  ajudaTexto,
  acaoConcluir,
}: {
  bucket: string;
  categoryId: string;
  accept?: string;
  multiple?: boolean;
  ajudaTexto?: string;
  acaoConcluir: (arquivos: { nomeArquivo: string; arquivoPath: string }[]) => Promise<void>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("arquivo") as HTMLInputElement;
    const arquivos = input.files ? Array.from(input.files) : [];
    if (arquivos.length === 0) return;

    setEnviando(true);
    setErro(null);

    const supabase = createClient();
    const falhas: string[] = [];
    const enviados: { nomeArquivo: string; arquivoPath: string }[] = [];

    for (const arquivo of arquivos) {
      const caminho = `${categoryId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(arquivo.name)}`;
      const { error } = await supabase.storage.from(bucket).upload(caminho, arquivo);
      if (error) {
        falhas.push(`${arquivo.name} (${error.message})`);
        continue;
      }
      enviados.push({ nomeArquivo: arquivo.name, arquivoPath: caminho });
    }

    if (enviados.length > 0) {
      await acaoConcluir(enviados);
    }

    setEnviando(false);
    formRef.current?.reset();
    setErro(falhas.length > 0 ? `Não foi possível enviar: ${falhas.join(", ")}` : null);
    router.refresh();
  }

  return (
    <div>
      {erro && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          name="arquivo"
          type="file"
          accept={accept}
          multiple={multiple}
          required
          disabled={enviando}
          className="flex-1 text-sm text-slate-600"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </form>
      {ajudaTexto && <p className="mt-2 text-xs text-slate-400">{ajudaTexto}</p>}
    </div>
  );
}
