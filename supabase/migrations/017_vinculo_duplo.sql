-- Troca o vínculo único "superior_id" por dois vínculos explícitos:
-- supervisor_id (vendedor -> supervisor) e gerente_id (vendedor ou
-- supervisor -> gerente comercial).

alter table public.profiles add column if not exists supervisor_id uuid references public.profiles (id) on delete set null;
alter table public.profiles add column if not exists gerente_id uuid references public.profiles (id) on delete set null;
alter table public.profiles drop column if exists superior_id;

create or replace function public.pode_ver(target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  alvo record;
begin
  if target_id is null then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  if target_id = auth.uid() then
    return true;
  end if;

  select supervisor_id, gerente_id into alvo
  from public.profiles
  where id = target_id;

  if alvo.supervisor_id = auth.uid() then
    return true;
  end if;

  if alvo.gerente_id = auth.uid() then
    return true;
  end if;

  return false;
end;
$$;

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
    if new.supervisor_id is distinct from old.supervisor_id then
      raise exception 'Apenas administradores podem alterar o vínculo hierárquico.';
    end if;
    if new.gerente_id is distinct from old.gerente_id then
      raise exception 'Apenas administradores podem alterar o vínculo hierárquico.';
    end if;
  end if;
  return new;
end;
$$;

notify pgrst, 'reload schema';
