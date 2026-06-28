-- Funil de vendas (pipeline) em formato kanban: novas etapas, motivo de
-- perda obrigatório, e "produto" no lugar de "título" no negócio.
-- As tabelas clients/deals não foram encontradas (sumiram ou ficaram fora
-- do cache) — recriamos do zero, já no formato novo.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'etapa_pipeline') then
    create type public.etapa_pipeline as enum (
      'novo_lead',
      'em_triagem',
      'proposta_enviada',
      'aguardando_decisao',
      'pedido_fechado',
      'transferido_externo',
      'perdido'
    );
  end if;
end$$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  empresa text,
  documento text,
  telefone text,
  email text,
  responsavel_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  produto text not null,
  valor numeric,
  etapa public.etapa_pipeline not null default 'novo_lead',
  motivo_perda text,
  responsavel_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  fechado_em timestamptz
);

alter table public.clients enable row level security;
alter table public.deals enable row level security;

drop policy if exists "admin_gerencia_clients" on public.clients;
create policy "admin_gerencia_clients" on public.clients for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "usuario_gerencia_proprios_clients" on public.clients;
create policy "usuario_gerencia_proprios_clients" on public.clients for all
  using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);

drop policy if exists "admin_gerencia_deals" on public.deals;
create policy "admin_gerencia_deals" on public.deals for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "usuario_gerencia_proprios_deals" on public.deals;
create policy "usuario_gerencia_proprios_deals" on public.deals for all
  using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);

notify pgrst, 'reload schema';
