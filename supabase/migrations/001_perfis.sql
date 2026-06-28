-- Tabela de perfis: guarda nome, setor, cargo e o "papel" (role) de cada pessoa.
-- A tabela auth.users (gerenciada pelo Supabase) já guarda email/senha;
-- aqui guardamos os dados extras que o sistema precisa.

create type public.user_role as enum ('admin', 'gestor', 'colaborador');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  email text not null,
  cpf text,
  setor text,
  cargo text,
  role public.user_role not null default 'colaborador',
  pontos integer not null default 0,
  created_at timestamptz not null default now()
);

-- Sempre que alguém cria uma conta (auth.users), criamos automaticamente
-- a linha correspondente em profiles, com papel "colaborador" por padrão.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Função auxiliar para checar se o usuário logado é admin, sem causar
-- recursão nas regras de segurança (RLS) abaixo.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

create policy "usuario_ve_proprio_perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "admin_ve_todos_perfis"
  on public.profiles for select
  using (public.is_admin());

create policy "usuario_atualiza_proprio_perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "admin_atualiza_qualquer_perfil"
  on public.profiles for update
  using (public.is_admin());
