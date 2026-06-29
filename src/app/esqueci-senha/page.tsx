import Link from "next/link";
import { solicitarRedefinicaoSenha } from "./actions";

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Recuperar acesso</h1>

        {enviado ? (
          <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Se esse e-mail estiver cadastrado, você vai receber um link em poucos minutos. Confira também o spam.
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">
              Digite seu e-mail e enviaremos um link pra redefinir sua senha.
            </p>
            <form action={solicitarRedefinicaoSenha} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Enviar
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-indigo-600 underline hover:text-indigo-700">
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
