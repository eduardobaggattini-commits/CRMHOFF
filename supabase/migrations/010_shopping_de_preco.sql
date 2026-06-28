-- Shopping de Preço: comparação do preço da Hoff com concorrentes,
-- pra cada produto/modelo.

create table public.price_comparisons (
  id uuid primary key default gen_random_uuid(),
  produto text not null,
  preco_hoff numeric not null,
  responsavel_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.price_comparison_competitors (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.price_comparisons (id) on delete cascade,
  nome text not null,
  preco numeric not null
);

alter table public.price_comparisons enable row level security;
alter table public.price_comparison_competitors enable row level security;

create policy "admin_gerencia_price_comparisons" on public.price_comparisons for all
  using (public.is_admin()) with check (public.is_admin());

create policy "usuario_gerencia_proprias_price_comparisons" on public.price_comparisons for all
  using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);

create policy "acesso_via_comparison" on public.price_comparison_competitors for all
  using (
    exists (
      select 1 from public.price_comparisons pc
      where pc.id = price_comparison_competitors.comparison_id
        and (pc.responsavel_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.price_comparisons pc
      where pc.id = price_comparison_competitors.comparison_id
        and (pc.responsavel_id = auth.uid() or public.is_admin())
    )
  );

notify pgrst, 'reload schema';
