-- Controle de "última vez que cada pessoa visitou cada área" (pra saber o
-- que é novidade pra ela) e horário planejado opcional no roteiro de visitas.

create table public.areas_visitadas (
  user_id uuid not null references public.profiles (id) on delete cascade,
  area text not null,
  visto_em timestamptz not null default now(),
  primary key (user_id, area)
);

alter table public.areas_visitadas enable row level security;

create policy "usuario_gerencia_propria_area_visitada" on public.areas_visitadas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.visitas add column if not exists hora_planejada time;

notify pgrst, 'reload schema';
