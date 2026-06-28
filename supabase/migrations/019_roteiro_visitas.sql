-- Roteiro de visitas: o gestor (supervisor/gerente/admin) planeja visitas
-- com antecedência pra um vendedor da própria árvore; o vendedor faz
-- check-in depois (ou remarca). Uma visita planejada é só uma linha de
-- "visitas" com data_planejada preenchida e status 'Agendada' até alguém
-- preencher o resultado — não precisou de tabela nova.

alter table public.visitas alter column data_hora drop not null;
alter table public.visitas add column if not exists data_planejada date;
alter table public.visitas add column if not exists planejado_por uuid references public.profiles (id) on delete set null;
alter table public.visitas add column if not exists observacao text;

-- Antes, só o próprio vendedor podia criar sua visita. Agora quem planeja
-- (supervisor/gerente/admin) também pode criar uma visita pra alguém da
-- própria árvore — substitui a política antiga por uma só, em cascata.
drop policy if exists "vendedor_cria_propria_visita" on public.visitas;
drop policy if exists "cria_visita_da_arvore" on public.visitas;
create policy "cria_visita_da_arvore" on public.visitas for insert
  with check (public.pode_ver(vendedor_id));

-- Não existia política de update pra visitas (não dava pra editar depois
-- de criada). Agora precisa: o vendedor faz check-in na própria visita, e
-- quem planejou (supervisor/gerente/admin) pode remarcar/cancelar a visita
-- de alguém da própria árvore.
drop policy if exists "atualiza_visita_da_arvore" on public.visitas;
create policy "atualiza_visita_da_arvore" on public.visitas for update
  using (public.pode_ver(vendedor_id)) with check (public.pode_ver(vendedor_id));

notify pgrst, 'reload schema';
