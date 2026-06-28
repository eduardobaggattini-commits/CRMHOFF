-- Transforma a "área" do treinamento de texto livre em pastas reais,
-- que o admin cria antes e escolhe de uma lista.

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

alter table public.areas enable row level security;

create policy "admin_gerencia_areas" on public.areas for all
  using (public.is_admin()) with check (public.is_admin());

create policy "usuarios_veem_areas" on public.areas for select
  using (auth.uid() is not null);

alter table public.courses add column area_id uuid references public.areas (id) on delete set null;
alter table public.courses drop column setor_alvo;
