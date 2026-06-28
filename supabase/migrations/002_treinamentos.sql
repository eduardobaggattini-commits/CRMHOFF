-- Treinamentos: curso > módulos > aulas, e quem está matriculado em quê.

create type public.tipo_aula as enum ('video', 'pdf', 'texto', 'imagem');
create type public.status_matricula as enum ('nao_iniciado', 'em_andamento', 'concluido');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  capa_url text,
  obrigatorio boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  titulo text not null,
  ordem integer not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  titulo text not null,
  tipo public.tipo_aula not null default 'video',
  conteudo_url text,
  duracao integer,
  ordem integer not null default 0
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  status public.status_matricula not null default 'nao_iniciado',
  atribuido_em timestamptz not null default now(),
  prazo date,
  unique (user_id, course_id)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  concluido boolean not null default false,
  concluido_em timestamptz,
  unique (user_id, lesson_id)
);

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;

-- courses: admin gerencia tudo; quem está matriculado pode ver o curso
create policy "admin_gerencia_courses" on public.courses for all
  using (public.is_admin()) with check (public.is_admin());

create policy "matriculados_veem_courses" on public.courses for select
  using (exists (
    select 1 from public.enrollments e
    where e.course_id = courses.id and e.user_id = auth.uid()
  ));

-- modules: visíveis para quem está matriculado no curso
create policy "admin_gerencia_modules" on public.modules for all
  using (public.is_admin()) with check (public.is_admin());

create policy "matriculados_veem_modules" on public.modules for select
  using (exists (
    select 1 from public.enrollments e
    where e.course_id = modules.course_id and e.user_id = auth.uid()
  ));

-- lessons: visíveis para quem está matriculado no curso da aula
create policy "admin_gerencia_lessons" on public.lessons for all
  using (public.is_admin()) with check (public.is_admin());

create policy "matriculados_veem_lessons" on public.lessons for select
  using (exists (
    select 1 from public.modules m
    join public.enrollments e on e.course_id = m.course_id
    where m.id = lessons.module_id and e.user_id = auth.uid()
  ));

-- enrollments: admin gerencia; cada pessoa vê/atualiza a própria matrícula
create policy "admin_gerencia_enrollments" on public.enrollments for all
  using (public.is_admin()) with check (public.is_admin());

create policy "usuario_ve_propria_matricula" on public.enrollments for select
  using (auth.uid() = user_id);

create policy "usuario_atualiza_propria_matricula" on public.enrollments for update
  using (auth.uid() = user_id);

-- lesson_progress: cada pessoa só vê/edita o próprio progresso; admin vê tudo
create policy "usuario_gerencia_proprio_progresso" on public.lesson_progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "admin_ve_todo_progresso" on public.lesson_progress for select
  using (public.is_admin());
