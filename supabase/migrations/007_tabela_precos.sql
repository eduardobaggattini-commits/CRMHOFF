-- Tabela de Preços: pastas por categoria de produto, com PDFs dentro.
-- Admin gerencia tudo; gestor e colaborador (vendedor) só leem.

create table public.price_categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table public.price_sheets (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.price_categories (id) on delete cascade,
  nome_arquivo text not null,
  arquivo_path text not null,
  criado_por uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.price_categories enable row level security;
alter table public.price_sheets enable row level security;

create policy "admin_gerencia_price_categories" on public.price_categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "autenticados_veem_price_categories" on public.price_categories for select
  using (auth.uid() is not null);

create policy "admin_gerencia_price_sheets" on public.price_sheets for all
  using (public.is_admin()) with check (public.is_admin());

create policy "autenticados_veem_price_sheets" on public.price_sheets for select
  using (auth.uid() is not null);

-- Acesso ao arquivo dentro do bucket privado "tabelas-precos"
create policy "admin_gerencia_storage_tabelas_precos" on storage.objects for all
  to authenticated
  using (bucket_id = 'tabelas-precos' and public.is_admin())
  with check (bucket_id = 'tabelas-precos' and public.is_admin());

create policy "autenticados_veem_storage_tabelas_precos" on storage.objects for select
  to authenticated
  using (bucket_id = 'tabelas-precos');
