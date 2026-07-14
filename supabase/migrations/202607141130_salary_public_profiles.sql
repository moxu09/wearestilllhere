create table if not exists public.salary_public_profiles (
  id uuid primary key default gen_random_uuid(),
  app_key text not null check (app_key in ('deepnight', 'qiunai')),
  discord_id text not null,
  display_name text,
  avatar_url text,
  intro text,
  invite_url text,
  games text[] not null default '{}',
  is_online boolean not null default false,
  can_take_order boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  featured_month date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (app_key, discord_id)
);

create index if not exists salary_public_profiles_public_index
  on public.salary_public_profiles (is_active, is_featured desc, is_online desc, updated_at desc);

alter table public.salary_public_profiles enable row level security;

revoke all on table public.salary_public_profiles from anon, authenticated;

comment on table public.salary_public_profiles is
  'Public-safe companion profiles synchronized from the DeepNight and Qiunai salary sites.';

insert into public.salary_public_profiles (
  app_key, discord_id, display_name, avatar_url,
  is_online, can_take_order, is_active, updated_at
)
select
  'deepnight', discord_id,
  coalesce(nullif(display_name, ''), nullif(discord_name, ''), '深夜陪陪'),
  avatar_url, coalesce(is_online, false), coalesce(can_take_order, true),
  coalesce(is_active, true), now()
from public.players
where discord_id is not null
on conflict (app_key, discord_id) do update set
  display_name = excluded.display_name,
  avatar_url = coalesce(excluded.avatar_url, salary_public_profiles.avatar_url),
  is_online = excluded.is_online,
  can_take_order = excluded.can_take_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.salary_public_profiles (
  app_key, discord_id, display_name, avatar_url,
  is_online, can_take_order, is_active, updated_at
)
select
  'qiunai', discord_id,
  coalesce(nullif(display_name, ''), nullif(discord_name, ''), '秋奈陪陪'),
  avatar_url, coalesce(is_online, false), coalesce(can_take_order, true),
  coalesce(is_active, true), now()
from public.qiunai_staff
where discord_id is not null
on conflict (app_key, discord_id) do update set
  display_name = excluded.display_name,
  avatar_url = coalesce(excluded.avatar_url, salary_public_profiles.avatar_url),
  is_online = excluded.is_online,
  can_take_order = excluded.can_take_order,
  is_active = excluded.is_active,
  updated_at = now();

update public.salary_public_profiles profile
set games = source.games
from (
  select
    discord_id,
    array_agg(distinct coalesce(
      nullif(category, ''),
      case
        when service_key like 'valorant_%' then '特戰英豪'
        when service_key like 'delta_%' then '三角洲行動'
        when service_key like 'apex_%' then 'Apex'
        when service_key like 'lol_%' then '英雄聯盟'
        when service_key like 'steam_%' then 'Steam'
        when service_key like 'hok_%' then '王者榮耀'
        when service_key like 'identity_v_%' then '第五人格'
        else '其他項目'
      end
    )) filter (where coalesce(enabled, true)) as games
  from public.players_services
  group by discord_id
) source
where profile.app_key = 'deepnight'
  and profile.discord_id = source.discord_id;

update public.salary_public_profiles profile
set games = source.games
from (
  select
    discord_id,
    array_agg(distinct case
      when service_key like 'valorant_%' then '特戰英豪'
      when service_key like 'delta_%' then '三角洲行動'
      when service_key like 'apex_%' then 'Apex'
      when service_key like 'lol_%' then '英雄聯盟'
      when service_key like 'steam_%' then 'Steam'
      when service_key like 'hok_%' then '王者榮耀'
      when service_key like 'identity_v_%' then '第五人格'
      else '其他項目'
    end) filter (where coalesce(enabled, true)) as games
  from public.qiunai_staff_services
  group by discord_id
) source
where profile.app_key = 'qiunai'
  and profile.discord_id = source.discord_id;
