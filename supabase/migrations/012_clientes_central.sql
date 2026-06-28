-- Base central de clientes: novos campos, vendedor responsável passa a ser
-- opcional (pode ficar sem dono até o admin atribuir), e só o admin
-- gerencia/importa — todo mundo logado só lê.

alter table public.clients add column if not exists cidade text;
alter table public.clients add column if not exists estado text;
alter table public.clients add column if not exists endereco text;
alter table public.clients add column if not exists observacoes text;

alter table public.clients alter column responsavel_id drop not null;

-- Evita clientes duplicados pelo mesmo CNPJ/CPF (permite vários em branco).
create unique index if not exists clients_documento_unico
  on public.clients (documento)
  where documento is not null and documento <> '';

drop policy if exists "usuario_gerencia_proprios_clients" on public.clients;

drop policy if exists "autenticados_veem_clients" on public.clients;
create policy "autenticados_veem_clients" on public.clients for select
  using (auth.uid() is not null);

notify pgrst, 'reload schema';
