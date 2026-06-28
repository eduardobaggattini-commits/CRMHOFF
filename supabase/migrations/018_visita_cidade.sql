-- Guarda a cidade já identificada (geocoding reverso) na própria visita,
-- em vez de depender do cadastro do cliente pra saber onde a visita ocorreu.

alter table public.visitas add column if not exists cidade_aproximada text;

notify pgrst, 'reload schema';
