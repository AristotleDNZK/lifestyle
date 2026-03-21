alter table generations
  alter column url drop not null;

alter table generations
  alter column cost set default 0;

alter table generations
  add column if not exists image_url text,
  add column if not exists error_message text,
  add column if not exists model_id text,
  add column if not exists aspect_ratio text,
  add column if not exists trigger_run_id text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table generations
  drop constraint if exists generations_status_check;

alter table generations
  add constraint generations_status_check
  check (status in ('pending', 'processing', 'completed', 'failed'));

update generations
set image_url = url
where image_url is null
  and url is not null
  and url <> '';

create index if not exists idx_generations_user_status
  on generations(user_id, status);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_generations_updated_at on generations;

create trigger set_generations_updated_at
before update on generations
for each row
execute function set_updated_at();
