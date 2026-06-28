-- Registro de visitas a clientes, com localização (GPS) capturada no momento.

create table public.visitas (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id),
  cliente_nome_livre text,
  objetivo text not null,
  status text not null,
  vendedor_id uuid not null references public.profiles (id),
  data_hora timestamptz not null default now(),
  latitude numeric,
  longitude numeric,
  endereco_aproximado text,
  created_at timestamptz not null default now()
);

alter table public.visitas enable row level security;

create policy "admin_gerencia_visitas" on public.visitas for all
  using (public.is_admin()) with check (public.is_admin());

create policy "vendedor_cria_propria_visita" on public.visitas for insert
  with check (auth.uid() = vendedor_id);

create policy "vendedor_ve_propria_visita" on public.visitas for select
  using (auth.uid() = vendedor_id);

notify pgrst, 'reload schema';
