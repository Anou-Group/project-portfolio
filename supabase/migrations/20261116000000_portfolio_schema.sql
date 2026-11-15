-- Project Portfolio: reporting schema, history and read-only public access.
-- Mirrors src/domain/schema.ts. Never edit after it is applied; add a new migration.

-- ---------- Enums ----------
create type public.work_status as enum ('completed', 'in_progress', 'pending', 'blocked', 'awaiting_approval');
create type public.task_category as enum ('development', 'configuration', 'research', 'testing', 'documentation', 'deployment', 'business_requirements', 'other');
create type public.activity_category as enum ('development', 'research', 'testing', 'deployment', 'documentation', 'meetings_coordination', 'decisions', 'other');
create type public.issue_kind as enum ('blocker', 'dependency', 'decision', 'approval', 'risk');
create type public.issue_status as enum ('open', 'resolved');
create type public.resource_type as enum (
  'github_repository', 'github_pull_request', 'figma_design', 'google_drive', 'notion_page',
  'technical_documentation', 'project_brief', 'strategy_document', 'meeting_notes', 'website', 'other'
);
create type public.priority as enum ('high', 'medium', 'low');

-- Text ids are authored in content files so publishing is an idempotent upsert.
create domain public.record_id as text check (value ~ '^[a-z0-9][a-z0-9-]{1,79}$');

-- ---------- Tables ----------
create table public.report_profile (
  id smallint primary key default 1 check (id = 1),
  owner_name text not null check (length(owner_name) between 1 and 120),
  owner_role text check (length(owner_role) <= 120),
  organisation text check (length(organisation) <= 120),
  report_purpose text not null check (length(report_purpose) between 1 and 600),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id public.record_id primary key,
  slug public.record_id not null unique,
  name text not null check (length(name) between 1 and 120),
  summary text not null check (length(summary) between 1 and 280),
  description text not null check (length(description) between 1 and 2000),
  business_objective text not null check (length(business_objective) between 1 and 1200),
  background text not null check (length(background) between 1 and 2000),
  responsibility_summary text not null check (length(responsibility_summary) between 1 and 160),
  responsibilities text[] not null check (cardinality(responsibilities) >= 1),
  status public.work_status not null,
  category text not null check (length(category) between 1 and 60),
  organisation text check (length(organisation) <= 120),
  progress_summary text not null check (length(progress_summary) between 1 and 400),
  source_note text not null check (length(source_note) between 1 and 400),
  last_verified_at date not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id public.record_id primary key,
  project_id public.record_id not null references public.projects (id) on delete restrict,
  title text not null check (length(title) between 1 and 160),
  description text not null check (length(description) between 1 and 1200),
  status public.work_status not null,
  category public.task_category not null,
  priority public.priority,
  latest_progress text check (length(latest_progress) <= 800),
  dependency text check (length(dependency) <= 600),
  evidence text check (length(evidence) <= 600),
  due_date date,
  completed_at date,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Only completed work has a completion date, and completed work must cite evidence
  -- (or a linked resource, checked by content:check before publishing).
  constraint completed_at_only_when_completed check (completed_at is null or status = 'completed'),
  constraint blocked_needs_dependency check (status not in ('blocked', 'awaiting_approval') or dependency is not null)
);
create index tasks_project_id_idx on public.tasks (project_id);

create table public.task_status_history (
  id bigint generated always as identity primary key,
  task_id public.record_id not null references public.tasks (id) on delete restrict,
  from_status public.work_status,
  to_status public.work_status not null,
  changed_at timestamptz not null default now()
);
create index task_status_history_task_id_idx on public.task_status_history (task_id);

create table public.project_status_history (
  id bigint generated always as identity primary key,
  project_id public.record_id not null references public.projects (id) on delete restrict,
  from_status public.work_status,
  to_status public.work_status not null,
  changed_at timestamptz not null default now()
);
create index project_status_history_project_id_idx on public.project_status_history (project_id);

create table public.issues (
  id public.record_id primary key,
  project_id public.record_id not null references public.projects (id) on delete restrict,
  title text not null check (length(title) between 1 and 160),
  description text not null check (length(description) between 1 and 1000),
  kind public.issue_kind not null,
  status public.issue_status not null default 'open',
  waiting_on text check (length(waiting_on) <= 120),
  raised_on date,
  resolved_on date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resolved_on_only_when_resolved check (resolved_on is null or status = 'resolved')
);
create index issues_project_id_idx on public.issues (project_id);

create table public.project_updates (
  id public.record_id primary key,
  project_id public.record_id not null references public.projects (id) on delete restrict,
  task_id public.record_id references public.tasks (id) on delete restrict,
  title text not null check (length(title) between 1 and 160),
  description text not null check (length(description) between 1 and 800),
  category public.activity_category not null,
  occurred_on date not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index project_updates_project_id_idx on public.project_updates (project_id);
create index project_updates_occurred_on_idx on public.project_updates (occurred_on desc);

create table public.resources (
  id public.record_id primary key,
  project_id public.record_id not null references public.projects (id) on delete restrict,
  task_id public.record_id references public.tasks (id) on delete restrict,
  title text not null check (length(title) between 1 and 160),
  description text not null check (length(description) between 1 and 400),
  resource_type public.resource_type not null,
  url text not null check (url ~ '^https://\S+$' or url ~ '^/documents/[A-Za-z0-9._-]+\.pdf$'),
  access_note text check (length(access_note) <= 160),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index resources_project_id_idx on public.resources (project_id);

create table public.stakeholders (
  id public.record_id primary key,
  project_id public.record_id not null references public.projects (id) on delete restrict,
  name text not null check (length(name) between 1 and 120),
  role text not null check (length(role) between 1 and 200),
  organisation text check (length(organisation) <= 120),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stakeholders_project_id_idx on public.stakeholders (project_id);

-- ---------- Triggers: timestamps, status history, no deletes ----------
create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create function public.record_task_status() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.task_status_history (task_id, from_status, to_status)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;
  return new;
end $$;

create function public.record_project_status() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.project_status_history (project_id, from_status, to_status)
    values (new.id, case when tg_op = 'UPDATE' then old.status end, new.status);
  end if;
  return new;
end $$;

-- History is never silently deleted. Hide a record with is_published = false instead.
create function public.prevent_delete() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Deleting % is not allowed: reporting history is preserved. Set is_published = false to hide it.', tg_table_name
    using errcode = 'restrict_violation';
end $$;

-- History rows are append-only.
create function public.prevent_update() returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Status history in % cannot be changed.', tg_table_name using errcode = 'restrict_violation';
end $$;

do $$
declare t text;
begin
  foreach t in array array['report_profile', 'projects', 'tasks', 'issues', 'project_updates', 'resources', 'stakeholders'] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
  foreach t in array array['projects', 'tasks', 'issues', 'project_updates', 'task_status_history', 'project_status_history'] loop
    execute format('create trigger prevent_delete before delete on public.%I for each row execute function public.prevent_delete()', t);
  end loop;
  foreach t in array array['task_status_history', 'project_status_history'] loop
    execute format('create trigger prevent_update before update on public.%I for each row execute function public.prevent_update()', t);
  end loop;
end $$;

create trigger record_task_status after insert or update of status on public.tasks
  for each row execute function public.record_task_status();
create trigger record_project_status after insert or update of status on public.projects
  for each row execute function public.record_project_status();

-- ---------- Row-level security: anonymous visitors read published rows only ----------
alter table public.report_profile enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_status_history enable row level security;
alter table public.project_status_history enable row level security;
alter table public.issues enable row level security;
alter table public.project_updates enable row level security;
alter table public.resources enable row level security;
alter table public.stakeholders enable row level security;

-- Defence in depth: the public roles get SELECT and nothing else.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
grant select on all tables in schema public to anon, authenticated;

create function public.project_is_published(pid text) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = pid and p.is_published)
$$;
create function public.task_is_published(tid text) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tasks t join public.projects p on p.id = t.project_id
    where t.id = tid and t.is_published and p.is_published
  )
$$;
revoke all on function public.project_is_published(text) from public;
revoke all on function public.task_is_published(text) from public;
grant execute on function public.project_is_published(text) to anon, authenticated;
grant execute on function public.task_is_published(text) to anon, authenticated;

create policy "Public can read the report profile" on public.report_profile
  for select to anon, authenticated using (true);
create policy "Public can read published projects" on public.projects
  for select to anon, authenticated using (is_published);
create policy "Public can read published tasks" on public.tasks
  for select to anon, authenticated using (is_published and public.project_is_published(project_id));
create policy "Public can read history of published tasks" on public.task_status_history
  for select to anon, authenticated using (public.task_is_published(task_id));
create policy "Public can read history of published projects" on public.project_status_history
  for select to anon, authenticated using (public.project_is_published(project_id));
create policy "Public can read published issues" on public.issues
  for select to anon, authenticated using (is_published and public.project_is_published(project_id));
create policy "Public can read published updates" on public.project_updates
  for select to anon, authenticated using (is_published and public.project_is_published(project_id));
create policy "Public can read published resources" on public.resources
  for select to anon, authenticated using (is_published and public.project_is_published(project_id));
create policy "Public can read published stakeholders" on public.stakeholders
  for select to anon, authenticated using (is_published and public.project_is_published(project_id));

-- Tables created later must not silently become writable by the public roles.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;
