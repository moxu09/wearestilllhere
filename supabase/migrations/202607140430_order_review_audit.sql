alter table public.play_orders
  add column if not exists review_decision text,
  add column if not exists reviewer_auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_discord_id text,
  add column if not exists reviewer_name text,
  add column if not exists review_reason text,
  add column if not exists reviewed_at timestamptz;

alter table public.qiunai_salary_orders
  add column if not exists review_decision text,
  add column if not exists reviewer_auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_discord_id text,
  add column if not exists reviewer_name text,
  add column if not exists review_reason text,
  add column if not exists reviewed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'play_orders_review_decision_check'
  ) then
    alter table public.play_orders
      add constraint play_orders_review_decision_check
      check (review_decision is null or review_decision in ('approved', 'rejected'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'qiunai_salary_orders_review_decision_check'
  ) then
    alter table public.qiunai_salary_orders
      add constraint qiunai_salary_orders_review_decision_check
      check (review_decision is null or review_decision in ('approved', 'rejected'));
  end if;
end;
$$;

create index if not exists play_orders_reviewed_at_idx
  on public.play_orders (reviewed_at desc)
  where reviewed_at is not null;

create index if not exists qiunai_salary_orders_reviewed_at_idx
  on public.qiunai_salary_orders (reviewed_at desc)
  where reviewed_at is not null;
