-- 4 níveis de perfil com visibilidade em cascata: admin > gerente_comercial >
-- supervisor > vendedor. Cada um vê a si mesmo e tudo abaixo na hierarquia.

alter type public.user_role rename value 'colaborador' to 'vendedor';
alter type public.user_role rename value 'gestor' to 'supervisor';
alter type public.user_role add value if not exists 'gerente_comercial';

-- A quem esse usuário responde (vendedor -> supervisor -> gerente_comercial).
alter table public.profiles add column if not exists superior_id uuid references public.profiles (id) on delete set null;

-- Verifica se quem está logado pode ver os dados de target_id: ele mesmo,
-- ou alguém abaixo dele na hierarquia (sobe a cadeia de superiores).
create or replace function public.pode_ver(target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  atual uuid := target_id;
  contagem integer := 0;
begin
  if target_id is null then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  loop
    if atual is null then
      return false;
    end if;
    if atual = auth.uid() then
      return true;
    end if;
    contagem := contagem + 1;
    if contagem > 10 then
      return false;
    end if;
    select superior_id into atual from public.profiles where id = atual;
  end loop;
end;
$$;

-- Só admin pode alterar o perfil (role) ou o vínculo (superior_id) de alguém.
create or replace function public.protege_colunas_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Apenas administradores podem alterar o perfil.';
    end if;
    if new.superior_id is distinct from old.superior_id then
      raise exception 'Apenas administradores podem alterar o vínculo hierárquico.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protege_colunas_perfil_trigger on public.profiles;
create trigger protege_colunas_perfil_trigger
  before update on public.profiles
  for each row execute function public.protege_colunas_perfil();

-- Gerente/supervisor podem ver (não editar) os perfis da própria árvore.
drop policy if exists "ve_perfis_da_arvore" on public.profiles;
create policy "ve_perfis_da_arvore" on public.profiles for select
  using (public.pode_ver(id));

-- Pipeline: leitura em cascata; só o próprio vendedor (ou admin) edita.
drop policy if exists "usuario_gerencia_proprios_deals" on public.deals;
drop policy if exists "ve_deals_da_arvore" on public.deals;
create policy "ve_deals_da_arvore" on public.deals for select
  using (public.pode_ver(responsavel_id));

drop policy if exists "vendedor_gerencia_proprios_deals" on public.deals;
create policy "vendedor_gerencia_proprios_deals" on public.deals for insert
  with check (auth.uid() = responsavel_id);
create policy "vendedor_atualiza_proprios_deals" on public.deals for update
  using (auth.uid() = responsavel_id) with check (auth.uid() = responsavel_id);
create policy "vendedor_remove_proprios_deals" on public.deals for delete
  using (auth.uid() = responsavel_id);

-- Visitas: leitura em cascata; só quem registrou (ou admin) edita/exclui.
drop policy if exists "vendedor_ve_propria_visita" on public.visitas;
drop policy if exists "ve_visitas_da_arvore" on public.visitas;
create policy "ve_visitas_da_arvore" on public.visitas for select
  using (public.pode_ver(vendedor_id));

-- Treinamento: matrículas e progresso visíveis em cascata pra gerente/supervisor.
drop policy if exists "ve_matriculas_da_arvore" on public.enrollments;
create policy "ve_matriculas_da_arvore" on public.enrollments for select
  using (public.pode_ver(user_id));

alter table public.lesson_progress enable row level security;

drop policy if exists "usuario_gerencia_proprio_progresso" on public.lesson_progress;
create policy "usuario_gerencia_proprio_progresso" on public.lesson_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ve_progresso_da_arvore" on public.lesson_progress;
create policy "ve_progresso_da_arvore" on public.lesson_progress for select
  using (public.pode_ver(user_id));

notify pgrst, 'reload schema';
