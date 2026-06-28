-- Divulgação: pastas com materiais de campanha (imagem/PDF), mesmo padrão
-- de acesso da Tabela de Preços (admin gerencia, todo mundo lê).

create table public.divulgacao_categories (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  parent_id uuid references public.divulgacao_categories (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.divulgacao_files (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.divulgacao_categories (id) on delete cascade,
  nome_arquivo text not null,
  arquivo_path text not null,
  criado_por uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.divulgacao_categories enable row level security;
alter table public.divulgacao_files enable row level security;

create policy "admin_gerencia_divulgacao_categories" on public.divulgacao_categories for all
  using (public.is_admin()) with check (public.is_admin());

create policy "autenticados_veem_divulgacao_categories" on public.divulgacao_categories for select
  using (auth.uid() is not null);

create policy "admin_gerencia_divulgacao_files" on public.divulgacao_files for all
  using (public.is_admin()) with check (public.is_admin());

create policy "autenticados_veem_divulgacao_files" on public.divulgacao_files for select
  using (auth.uid() is not null);

create policy "admin_gerencia_storage_divulgacao" on storage.objects for all
  to authenticated
  using (bucket_id = 'divulgacao' and public.is_admin())
  with check (bucket_id = 'divulgacao' and public.is_admin());

create policy "autenticados_veem_storage_divulgacao" on storage.objects for select
  to authenticated
  using (bucket_id = 'divulgacao');

notify pgrst, 'reload schema';
