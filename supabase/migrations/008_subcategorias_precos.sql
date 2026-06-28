-- Permite que uma categoria de preço tenha "subpastas" dentro dela
-- (ex: PNEUS NOVOS > PNEUS TB, PNEUS NOVOS > PNEUS AG).

alter table public.price_categories
  add column parent_id uuid references public.price_categories (id) on delete cascade;
