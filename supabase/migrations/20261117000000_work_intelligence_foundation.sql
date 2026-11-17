-- Work Intelligence foundation: proposals and immutable record history.
-- Additive migration. Existing portfolio records and public read behavior stay intact.

-- Optimistic concurrency version for canonical records and proposals.
alter table public.report_profile add column version integer not null default 1 check (version > 0);
alter table public.projects add column version integer not null default 1 check (version > 0);
alter table public.tasks add column version integer not null default 1 check (version > 0);
alter table public.issues add column version integer not null default 1 check (version > 0);
alter table public.project_updates add column version integer not null default 1 check (version > 0);
alter table public.resources add column version integer not null default 1 check (version > 0);
alter table public.stakeholders add column version integer not null default 1 check (version > 0);

create type public.proposal_status as enum ('pending', 'approved', 'rejected', 'superseded');
create type public.proposal_source as enum ('conversation', 'document', 'manual');

-- This queue is private. Proposals are not manager-facing canonical records.
create table public.change_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 180),
  summary text not null check (length(summary) between 1 and 2000),
  source_type public.proposal_source not null,
  source_refs jsonb not null default '[]'::jsonb check (jsonb_typeof(source_refs) = 'array'),
  target_type text not null check (target_type in ('project', 'task', 'issue', 'project_update', 'resource', 'stakeholder', 'decision', 'recurring_work')),
  target_id text,
  operation text not null check (operation in ('create', 'update', 'hide')),
  base_version integer check (base_version is null or base_version > 0),
  proposed_changes jsonb not null check (jsonb_typeof(proposed_changes) = 'object'),
  status public.proposal_status not null default 'pending',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text,
  review_note text check (length(review_note) <= 2000),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposal_review_fields_match_status check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null)
    or (status <> 'pending' and reviewed_at is not null and reviewed_by is not null)
  ),
  constraint proposal_target_version_match check (
    (operation = 'create' and target_id is null and base_version is null)
    or (operation <> 'create' and target_id is not null and base_version is not null)
  )
);
create index change_proposals_pending_idx on public.change_proposals (submitted_at desc) where status = 'pending';
create index change_proposals_target_idx on public.change_proposals (target_type, target_id);

-- Full row snapshots provide record versions; audit events provide an event trail.
create table public.record_versions (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text not null,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  recorded_at timestamptz not null default now(),
  change_source text not null default 'system',
  proposal_id uuid references public.change_proposals (id) on delete restrict,
  unique (entity_type, entity_id, version)
);
create index record_versions_entity_idx on public.record_versions (entity_type, entity_id, version desc);

create table public.audit_events (
  id bigint generated always as identity primary key,
  entity_type text not null,
  entity_id text not null,
  event_type text not null check (event_type in ('created', 'updated')),
  version integer not null check (version > 0),
  changed_fields text[] not null default '{}',
  occurred_at timestamptz not null default now(),
  change_source text not null default 'system',
  proposal_id uuid references public.change_proposals (id) on delete restrict
);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);
create index audit_events_occurred_at_idx on public.audit_events (occurred_at desc);

-- Seed one current-state snapshot for each existing row. Historical status
-- transitions remain in their existing status-history tables; no earlier edits
-- are inferred from updated_at.
insert into public.record_versions (entity_type, entity_id, version, snapshot, recorded_at, change_source)
select 'report_profile', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.report_profile r
union all
select 'projects', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.projects r
union all
select 'tasks', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.tasks r
union all
select 'issues', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.issues r
union all
select 'project_updates', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.project_updates r
union all
select 'resources', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.resources r
union all
select 'stakeholders', id::text, version, to_jsonb(r), updated_at, 'migration_baseline' from public.stakeholders r;

-- Only real content changes advance the version. updated_at/version are excluded
-- from comparison so routine idempotent publishes do not create false history.
create function public.advance_record_version() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new) - 'updated_at' - 'version') is distinct from
     (to_jsonb(old) - 'updated_at' - 'version') then
    new.version := old.version + 1;
  else
    new.version := old.version;
  end if;
  return new;
end $$;

create function public.capture_record_change() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  old_row jsonb;
  new_row jsonb := to_jsonb(new);
  changed text[];
  src text := coalesce(nullif(current_setting('app.change_source', true), ''), 'system');
  proposal text := nullif(current_setting('app.proposal_id', true), '');
  row_id text := new_row ->> 'id';
  row_version integer := coalesce((new_row ->> 'version')::integer, 1);
begin
  if tg_op = 'UPDATE' then
    old_row := to_jsonb(old);
    if (new_row - 'updated_at' - 'version') is not distinct from
       (old_row - 'updated_at' - 'version') then
      return new;
    end if;
    select coalesce(array_agg(k order by k), '{}') into changed
    from (
      select key as k
      from jsonb_each(new_row - 'updated_at' - 'version')
      union
      select key as k
      from jsonb_each(old_row - 'updated_at' - 'version')
    ) keys
    where (new_row -> keys.k) is distinct from (old_row -> keys.k);
  else
    changed := array(select jsonb_object_keys(new_row) order by 1);
  end if;

  insert into public.record_versions (entity_type, entity_id, version, snapshot, change_source, proposal_id)
  values (tg_table_name, row_id, row_version, new_row, src, proposal::uuid);

  insert into public.audit_events (entity_type, entity_id, event_type, version, changed_fields, change_source, proposal_id)
  values (tg_table_name, row_id, case when tg_op = 'INSERT' then 'created' else 'updated' end,
          row_version, changed, src, proposal::uuid);
  return new;
end $$;

-- Trigger execution order is alphabetical; version advancement ignores updated_at.
create trigger set_record_version before update on public.report_profile
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.projects
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.tasks
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.issues
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.project_updates
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.resources
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.stakeholders
  for each row execute function public.advance_record_version();
create trigger set_record_version before update on public.change_proposals
  for each row execute function public.advance_record_version();

create function public.validate_proposal_review() returns trigger
  language plpgsql set search_path = '' as $$
begin
  if old.status <> 'pending' then
    raise exception 'A reviewed proposal is immutable.' using errcode = 'restrict_violation';
  end if;
  if new.status = 'pending' then
    raise exception 'A pending proposal may only transition to a reviewed status.' using errcode = 'check_violation';
  end if;
  if (to_jsonb(new) - array['status', 'reviewed_at', 'reviewed_by', 'review_note', 'updated_at', 'version']) is distinct from
     (to_jsonb(old) - array['status', 'reviewed_at', 'reviewed_by', 'review_note', 'updated_at', 'version']) then
    raise exception 'Submitted proposal content is immutable.' using errcode = 'restrict_violation';
  end if;
  return new;
end $$;
create trigger validate_proposal_review before update on public.change_proposals
  for each row execute function public.validate_proposal_review();
create trigger prevent_delete before delete on public.change_proposals
  for each row execute function public.prevent_delete();

create trigger capture_record_change after insert or update on public.report_profile
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.projects
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.tasks
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.issues
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.project_updates
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.resources
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.stakeholders
  for each row execute function public.capture_record_change();
create trigger capture_record_change after insert or update on public.change_proposals
  for each row execute function public.capture_record_change();

-- History is append-only. Proposal status itself may change, and is audited above.
create function public.prevent_history_mutation() returns trigger
  language plpgsql set search_path = '' as $$
begin
  raise exception 'Rows in % are append-only.', tg_table_name using errcode = 'restrict_violation';
end $$;
create trigger record_versions_append_only before update or delete on public.record_versions
  for each row execute function public.prevent_history_mutation();
create trigger audit_events_append_only before update or delete on public.audit_events
  for each row execute function public.prevent_history_mutation();

alter table public.change_proposals enable row level security;
alter table public.record_versions enable row level security;
alter table public.audit_events enable row level security;
revoke all on public.change_proposals, public.record_versions, public.audit_events from anon, authenticated;
revoke all on sequence public.record_versions_id_seq, public.audit_events_id_seq from anon, authenticated;
revoke all on function public.advance_record_version() from public, anon, authenticated;
revoke all on function public.capture_record_change() from public, anon, authenticated;
revoke all on function public.prevent_history_mutation() from public, anon, authenticated;
revoke all on function public.validate_proposal_review() from public, anon, authenticated;

grant all on public.change_proposals, public.record_versions, public.audit_events to service_role;
grant usage, select on sequence public.record_versions_id_seq, public.audit_events_id_seq to service_role;
