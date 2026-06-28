"use client";

import { useState } from "react";
import { ROTULO_PAPEL } from "@/lib/perfis";

type Pessoa = { id: string; nome: string };

export function UsuarioForm({
  action,
  supervisores,
  gerentes,
  valoresIniciais,
  precisaSenha = true,
  userId,
}: {
  action: (formData: FormData) => void;
  supervisores: Pessoa[];
  gerentes: Pessoa[];
  valoresIniciais?: {
    nome: string;
    email?: string;
    role: string;
    supervisor_id: string | null;
    gerente_id: string | null;
  };
  precisaSenha?: boolean;
  userId?: string;
}) {
  const [role, setRole] = useState(valoresIniciais?.role ?? "vendedor");

  return (
    <form action={action} className="space-y-4">
      {userId && <input type="hidden" name="userId" value={userId} />}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
        <input
          name="nome"
          defaultValue={valoresIniciais?.nome ?? ""}
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {valoresIniciais?.email === undefined ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {valoresIniciais.email}
          </p>
        </div>
      )}

      {precisaSenha && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
          <input
            name="senha"
            type="password"
            minLength={6}
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Perfil</label>
        <select
          name="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
        >
          {Object.entries(ROTULO_PAPEL).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>
              {rotulo}
            </option>
          ))}
        </select>
      </div>

      {role === "vendedor" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Supervisor</label>
          <select
            name="supervisor_id"
            defaultValue={valoresIniciais?.supervisor_id ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Sem supervisor definido</option>
            {supervisores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {(role === "vendedor" || role === "supervisor") && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Gerente comercial
          </label>
          <select
            name="gerente_id"
            defaultValue={valoresIniciais?.gerente_id ?? ""}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Sem gerente definido</option>
            {gerentes.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Salvar
      </button>
    </form>
  );
}
