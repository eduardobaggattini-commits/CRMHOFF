-- Questionário por aula: até 5 perguntas de múltipla escolha, correção
-- automática, e nota mínima opcional pra considerar a aula concluída.

create table public.lesson_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  enunciado text not null,
  ordem integer not null default 0
);

create table public.lesson_question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.lesson_questions (id) on delete cascade,
  texto text not null,
  correta boolean not null default false,
  ordem integer not null default 0
);

alter table public.lessons add column if not exists acertos_minimos integer;

alter table public.lesson_progress add column if not exists acertos integer;
alter table public.lesson_progress add column if not exists total_perguntas integer;

alter table public.lesson_questions enable row level security;
alter table public.lesson_question_options enable row level security;

create policy "admin_gerencia_lesson_questions" on public.lesson_questions for all
  using (public.is_admin()) with check (public.is_admin());

create policy "matriculados_veem_lesson_questions" on public.lesson_questions for select
  using (exists (
    select 1 from public.lessons l
    join public.modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where l.id = lesson_questions.lesson_id and e.user_id = auth.uid()
  ));

create policy "admin_gerencia_lesson_question_options" on public.lesson_question_options for all
  using (public.is_admin()) with check (public.is_admin());

create policy "matriculados_veem_lesson_question_options" on public.lesson_question_options for select
  using (exists (
    select 1 from public.lesson_questions q
    join public.lessons l on l.id = q.lesson_id
    join public.modules m on m.id = l.module_id
    join public.enrollments e on e.course_id = m.course_id
    where q.id = lesson_question_options.question_id and e.user_id = auth.uid()
  ));

notify pgrst, 'reload schema';
