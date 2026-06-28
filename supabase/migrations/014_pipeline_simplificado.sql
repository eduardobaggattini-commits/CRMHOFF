-- Substitui o pipeline anterior por uma versão mais simples: 5 etapas,
-- origem do lead, e data de reavaliação para a etapa "Reavaliar em 90 dias".

alter table public.deals drop column if exists etapa;

do $$
begin
  if exists (select 1 from pg_type where typname = 'etapa_pipeline') then
    drop type public.etapa_pipeline;
  end if;
end$$;

create type public.etapa_pipeline as enum (
  'novo_lead',
  'em_negociacao',
  'fechado',
  'reavaliar_90_dias',
  'perdido'
);

alter table public.deals add column etapa public.etapa_pipeline not null default 'novo_lead';
alter table public.deals add column if not exists cliente_nome_livre text;
alter table public.deals add column if not exists cliente_telefone_livre text;
alter table public.deals add column if not exists origem_lead text;
alter table public.deals add column if not exists data_reavaliacao date;

alter table public.deals alter column client_id drop not null;

notify pgrst, 'reload schema';
