-- Clientes do CRM e o funil de vendas (negócios em andamento).

create type public.etapa_negocio as enum (
  'novo', 'contato', 'proposta', 'negociacao', 'ganho', 'perdido'
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  documento text,
  telefone text,
  email text,
  responsavel_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  titulo text not null,
  valor numeric,
  etapa public.etapa_negocio not null default 'novo',
  responsavel_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  fechado_em timestamptz
);

alter table public.clients enable row level security;
alter table public.deals enable row level security;

-- admin vê e gerencia tudo; cada pessoa só vê/gerencia o que é responsável
create policy "admin_gerencia_clients" on public.clients for all
  using (public.is_admin()) with check (public.is_admin());

create policy "usuario_gerencia_proprios_clients" on public.clients for all
  using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);

create policy "admin_gerencia_deals" on public.deals for all
  using (public.is_admin()) with check (public.is_admin());

create policy "usuario_gerencia_proprios_deals" on public.deals for all
  using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);
