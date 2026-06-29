import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; aviso?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-1 text-2xl font-bold text-slate-800">Entrar</h1>
        <p className="mb-6 text-sm text-slate-500">
          Acesse a plataforma de treinamentos.
        </p>

        {params.aviso && (
          <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            {params.aviso}
          </p>
        )}
        {params.erro && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.erro}
          </p>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
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
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Entrar
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/esqueci-senha" className="font-medium text-indigo-600 underline hover:text-indigo-700">
            Esqueci minha senha
          </Link>
        </p>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sua conta é criada pelo administrador do sistema.
        </p>
      </div>
    </main>
  );
}
