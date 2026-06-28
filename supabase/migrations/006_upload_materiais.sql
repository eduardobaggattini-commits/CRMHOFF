-- Permite que o admin envie arquivos (vídeo/pdf/ppt) para o bucket "materiais",
-- e que qualquer pessoa logada consiga abrir o arquivo pelo link.
-- Também adiciona "documento" como um tipo de aula possível.

create policy "admin_gerencia_materiais" on storage.objects for all
  to authenticated
  using (bucket_id = 'materiais' and public.is_admin())
  with check (bucket_id = 'materiais' and public.is_admin());

create policy "autenticados_veem_materiais" on storage.objects for select
  to authenticated
  using (bucket_id = 'materiais');

alter type public.tipo_aula add value if not exists 'documento';
