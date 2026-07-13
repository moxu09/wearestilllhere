begin;

create table if not exists public.alliance_membership_settings (
  id text primary key default 'main',
  reward_points_per_asd numeric(12,4) not null default 1,
  discount_points_per_asd integer not null default 100 check (discount_points_per_asd > 0),
  deepnight_guild_id text not null default '1501098191813214312',
  qiunai_guild_id text not null default '1206138511535898654',
  updated_at timestamptz not null default now()
);

insert into public.alliance_membership_settings (id)
values ('main')
on conflict (id) do nothing;

create table if not exists public.alliance_membership_tiers (
  tier_key text primary key,
  tier_name text not null,
  threshold_points numeric(12,2),
  duration_months integer,
  renewal_points numeric(12,2),
  points_multiplier numeric(6,2) not null default 1,
  sort_order integer not null,
  card_image_url text,
  is_invitation_only boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.alliance_membership_tiers
  (tier_key, tier_name, threshold_points, duration_months, renewal_points, points_multiplier, sort_order, is_invitation_only)
values
  ('star_traveler', '星旅會員', 0, null, 0, 1, 10, false),
  ('silver_wing', '銀翼會員', 10, 24, 15, 1.1, 20, false),
  ('gold_wing', '金翼會員', 45, 24, 60, 1.25, 30, false),
  ('radiant_star', '曜星會員', 88, 12, 100, 1.5, 40, false),
  ('obsidian', '黑曜會員', 200, 12, 180, 1.75, 50, false),
  ('exclusive', '尊享會員', null, 12, null, 2, 60, true)
on conflict (tier_key) do update set
  tier_name = excluded.tier_name,
  threshold_points = excluded.threshold_points,
  duration_months = excluded.duration_months,
  renewal_points = excluded.renewal_points,
  points_multiplier = excluded.points_multiplier,
  sort_order = excluded.sort_order,
  is_invitation_only = excluded.is_invitation_only,
  updated_at = now();

create table if not exists public.alliance_members (
  discord_user_id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  display_name text,
  avatar_url text,
  tier_key text not null default 'star_traveler' references public.alliance_membership_tiers(tier_key),
  lifetime_points numeric(14,2) not null default 0,
  period_points numeric(14,2) not null default 0,
  reward_points bigint not null default 0 check (reward_points >= 0),
  qualifying_spend numeric(14,2) not null default 0,
  qualifying_topup numeric(14,2) not null default 0,
  membership_started_at timestamptz not null default now(),
  period_started_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alliance_point_ledger (
  id bigint generated always as identity primary key,
  discord_user_id text not null references public.alliance_members(discord_user_id) on delete cascade,
  point_kind text not null check (point_kind in ('membership', 'reward')),
  delta numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  source_type text not null,
  source_guild_id text,
  source_key text,
  qualifying_amount numeric(14,2),
  note text,
  created_by uuid references auth.users(id) on delete set null,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists alliance_point_ledger_member_created_idx
  on public.alliance_point_ledger (discord_user_id, created_at desc);

create table if not exists public.alliance_rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  reward_type text not null check (reward_type in ('prize', 'coupon', 'discount_coupon')),
  points_cost bigint not null check (points_cost > 0),
  stock integer check (stock is null or stock >= 0),
  image_url text,
  coupon_name text,
  status text not null default 'active' check (status in ('active', 'paused', 'deleted')),
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.alliance_redemption_requests (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null references public.alliance_members(discord_user_id) on delete cascade,
  reward_id uuid references public.alliance_rewards(id) on delete set null,
  reward_name text not null,
  reward_type text not null check (reward_type in ('prize', 'coupon', 'discount_coupon')),
  points_spent bigint not null check (points_spent > 0),
  discount_amount integer,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
  request_note text,
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  inventory_item_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists alliance_redemptions_member_created_idx
  on public.alliance_redemption_requests (discord_user_id, created_at desc);
create index if not exists alliance_redemptions_status_created_idx
  on public.alliance_redemption_requests (status, created_at);

create or replace function public.alliance_recalculate_tier(p_discord_user_id text)
returns public.alliance_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.alliance_members%rowtype;
  v_tier public.alliance_membership_tiers%rowtype;
  v_old_key text;
begin
  select * into v_member from public.alliance_members
  where discord_user_id = p_discord_user_id for update;
  if not found then raise exception '找不到聯盟會員'; end if;
  if v_member.tier_key = 'exclusive' then return v_member; end if;

  select * into v_tier from public.alliance_membership_tiers
  where is_active and not is_invitation_only
    and threshold_points <= v_member.lifetime_points
  order by threshold_points desc limit 1;

  v_old_key := v_member.tier_key;
  update public.alliance_members set
    tier_key = v_tier.tier_key,
    membership_started_at = case when v_old_key <> v_tier.tier_key then now() else membership_started_at end,
    period_started_at = case when v_old_key <> v_tier.tier_key then now() else period_started_at end,
    period_points = case when v_old_key <> v_tier.tier_key then 0 else period_points end,
    expires_at = case
      when v_tier.duration_months is null then null
      when v_old_key <> v_tier.tier_key then now() + make_interval(months => v_tier.duration_months)
      else expires_at
    end,
    updated_at = now()
  where discord_user_id = p_discord_user_id
  returning * into v_member;
  return v_member;
end;
$$;

create or replace function public.alliance_apply_activity(
  p_discord_user_id text,
  p_guild_id text,
  p_activity_type text,
  p_amount numeric,
  p_source_key text,
  p_note text default null
)
returns public.alliance_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.alliance_members%rowtype;
  v_tier public.alliance_membership_tiers%rowtype;
  v_settings public.alliance_membership_settings%rowtype;
  v_membership_delta numeric(14,2);
  v_reward_delta bigint := 0;
  v_sign integer := case when p_amount < 0 then -1 else 1 end;
begin
  if p_activity_type not in ('spend', 'topup', 'refund', 'manual') then
    raise exception '不支援的聯盟積分活動類型';
  end if;
  if p_amount = 0 then raise exception '金額不可為 0'; end if;

  insert into public.alliance_members (discord_user_id)
  values (p_discord_user_id)
  on conflict (discord_user_id) do nothing;
  select * into v_member from public.alliance_members
  where discord_user_id = p_discord_user_id for update;
  select * into v_tier from public.alliance_membership_tiers where tier_key = v_member.tier_key;
  select * into v_settings from public.alliance_membership_settings where id = 'main';

  if p_activity_type in ('spend', 'refund') then
    v_membership_delta := round((p_amount / 1000) * v_tier.points_multiplier, 2);
    v_reward_delta := trunc(p_amount * v_settings.reward_points_per_asd);
  elsif p_activity_type = 'topup' then
    v_membership_delta := round(p_amount / 5000, 2);
  else
    v_membership_delta := round(p_amount, 2);
  end if;

  if p_source_key is not null and exists (
    select 1 from public.alliance_point_ledger
    where dedupe_key = 'membership:' || p_source_key
  ) then return v_member; end if;

  update public.alliance_members set
    lifetime_points = greatest(0, lifetime_points + v_membership_delta),
    period_points = greatest(0, period_points + v_membership_delta),
    reward_points = greatest(0, reward_points + v_reward_delta),
    qualifying_spend = greatest(0, qualifying_spend + case when p_activity_type in ('spend', 'refund') then p_amount else 0 end),
    qualifying_topup = greatest(0, qualifying_topup + case when p_activity_type = 'topup' then p_amount else 0 end),
    updated_at = now()
  where discord_user_id = p_discord_user_id
  returning * into v_member;

  insert into public.alliance_point_ledger
    (discord_user_id, point_kind, delta, balance_after, source_type, source_guild_id, source_key, qualifying_amount, note, dedupe_key)
  values
    (p_discord_user_id, 'membership', v_membership_delta, v_member.lifetime_points, p_activity_type, p_guild_id, p_source_key, p_amount, p_note,
     case when p_source_key is null then null else 'membership:' || p_source_key end);
  if v_reward_delta <> 0 then
    insert into public.alliance_point_ledger
      (discord_user_id, point_kind, delta, balance_after, source_type, source_guild_id, source_key, qualifying_amount, note, dedupe_key)
    values
      (p_discord_user_id, 'reward', v_reward_delta, v_member.reward_points, p_activity_type, p_guild_id, p_source_key, p_amount, p_note,
       case when p_source_key is null then null else 'reward:' || p_source_key end);
  end if;
  return public.alliance_recalculate_tier(p_discord_user_id);
end;
$$;

create or replace function public.alliance_adjust_points(
  p_discord_user_id text,
  p_point_kind text,
  p_delta numeric,
  p_note text,
  p_created_by uuid default null
)
returns public.alliance_members
language plpgsql
security definer
set search_path = public
as $$
declare v_member public.alliance_members%rowtype;
begin
  if p_point_kind not in ('membership', 'reward') or p_delta = 0 then raise exception '積分調整參數錯誤'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception '請填寫積分調整原因'; end if;
  insert into public.alliance_members (discord_user_id) values (p_discord_user_id)
  on conflict (discord_user_id) do nothing;
  if p_point_kind = 'membership' then
    update public.alliance_members set lifetime_points = greatest(0, lifetime_points + p_delta),
      period_points = greatest(0, period_points + p_delta), updated_at = now()
    where discord_user_id = p_discord_user_id returning * into v_member;
    insert into public.alliance_point_ledger
      (discord_user_id, point_kind, delta, balance_after, source_type, note, created_by)
    values (p_discord_user_id, p_point_kind, p_delta, v_member.lifetime_points, 'staff_adjustment', p_note, p_created_by);
    return public.alliance_recalculate_tier(p_discord_user_id);
  end if;
  update public.alliance_members set reward_points = greatest(0, reward_points + trunc(p_delta)), updated_at = now()
  where discord_user_id = p_discord_user_id returning * into v_member;
  insert into public.alliance_point_ledger
    (discord_user_id, point_kind, delta, balance_after, source_type, note, created_by)
  values (p_discord_user_id, p_point_kind, trunc(p_delta), v_member.reward_points, 'staff_adjustment', p_note, p_created_by);
  return v_member;
end;
$$;

create or replace function public.alliance_request_redemption(
  p_discord_user_id text,
  p_reward_id uuid default null,
  p_discount_points bigint default null,
  p_request_note text default null
)
returns public.alliance_redemption_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.alliance_members%rowtype;
  v_reward public.alliance_rewards%rowtype;
  v_settings public.alliance_membership_settings%rowtype;
  v_points bigint;
  v_name text;
  v_type text;
  v_discount integer;
  v_request public.alliance_redemption_requests%rowtype;
begin
  select * into v_member from public.alliance_members where discord_user_id = p_discord_user_id for update;
  if not found then raise exception '找不到聯盟會員'; end if;
  if p_reward_id is null then
    select * into v_settings from public.alliance_membership_settings where id = 'main';
    v_points := p_discount_points;
    if v_points is null or v_points <= 0 or mod(v_points, v_settings.discount_points_per_asd) <> 0 then
      raise exception '折價積分必須是 % 的正整數倍', v_settings.discount_points_per_asd;
    end if;
    v_discount := v_points / v_settings.discount_points_per_asd;
    v_name := v_discount || ' ASD 折價券';
    v_type := 'discount_coupon';
  else
    select * into v_reward from public.alliance_rewards where id = p_reward_id and status = 'active' for update;
    if not found then raise exception '此兌換商品目前不可兌換'; end if;
    if v_reward.stock is not null and v_reward.stock <= 0 then raise exception '此兌換商品已無庫存'; end if;
    v_points := v_reward.points_cost;
    v_name := v_reward.name;
    v_type := v_reward.reward_type;
  end if;
  if v_member.reward_points < v_points then raise exception '獎勵積分不足'; end if;

  update public.alliance_members set reward_points = reward_points - v_points, updated_at = now()
  where discord_user_id = p_discord_user_id returning * into v_member;
  insert into public.alliance_point_ledger
    (discord_user_id, point_kind, delta, balance_after, source_type, note)
  values (p_discord_user_id, 'reward', -v_points, v_member.reward_points, 'redemption_pending', v_name);
  if p_reward_id is not null and v_reward.stock is not null then
    update public.alliance_rewards set stock = stock - 1, updated_at = now() where id = p_reward_id;
  end if;
  insert into public.alliance_redemption_requests
    (discord_user_id, reward_id, reward_name, reward_type, points_spent, discount_amount, request_note)
  values (p_discord_user_id, p_reward_id, v_name, v_type, v_points, v_discount, p_request_note)
  returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.alliance_review_redemption(
  p_request_id uuid,
  p_approved boolean,
  p_reviewed_by uuid,
  p_review_note text default null
)
returns public.alliance_redemption_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.alliance_redemption_requests%rowtype;
  v_member public.alliance_members%rowtype;
  v_item_id bigint;
begin
  select * into v_request from public.alliance_redemption_requests where id = p_request_id for update;
  if not found or v_request.status <> 'pending' then raise exception '此兌換申請已處理或不存在'; end if;
  select * into v_member from public.alliance_members where discord_user_id = v_request.discord_user_id for update;
  if p_approved then
    if v_request.reward_type in ('coupon', 'discount_coupon') then
      insert into public.user_items (user_id, item_name, rarity, description, item_type, guild_id)
      values (v_request.discord_user_id, v_request.reward_name, '星夜聯盟',
        coalesce(v_request.review_note, '星夜聯盟獎勵積分兌換'), 'coupon', null)
      returning id into v_item_id;
    end if;
    update public.alliance_redemption_requests set status = 'approved', inventory_item_id = v_item_id,
      reviewed_by = p_reviewed_by, reviewed_at = now(), review_note = p_review_note, updated_at = now()
    where id = p_request_id returning * into v_request;
  else
    update public.alliance_members set reward_points = reward_points + v_request.points_spent, updated_at = now()
    where discord_user_id = v_request.discord_user_id returning * into v_member;
    insert into public.alliance_point_ledger
      (discord_user_id, point_kind, delta, balance_after, source_type, note, created_by)
    values (v_request.discord_user_id, 'reward', v_request.points_spent, v_member.reward_points,
      'redemption_rejected', coalesce(p_review_note, v_request.reward_name), p_reviewed_by);
    if v_request.reward_id is not null then
      update public.alliance_rewards set stock = case when stock is null then null else stock + 1 end, updated_at = now()
      where id = v_request.reward_id;
    end if;
    update public.alliance_redemption_requests set status = 'rejected', reviewed_by = p_reviewed_by,
      reviewed_at = now(), review_note = p_review_note, updated_at = now()
    where id = p_request_id returning * into v_request;
  end if;
  return v_request;
end;
$$;

-- Existing store-specific VIP totals become the alliance member's initial qualification totals.
with legacy as (
  select user_id,
    sum(greatest(total_spent, 0))::numeric as total_spent,
    sum(greatest(total_topup, 0))::numeric as total_topup
  from public.user_vips
  where guild_id in ('1501098191813214312', '1206138511535898654')
  group by user_id
), converted as (
  select user_id, total_spent, total_topup,
    round(total_spent / 1000 + total_topup / 5000, 2) as points
  from legacy
)
insert into public.alliance_members
  (discord_user_id, lifetime_points, period_points, qualifying_spend, qualifying_topup, tier_key, expires_at)
select c.user_id, c.points, 0, c.total_spent, c.total_topup,
  coalesce((select t.tier_key from public.alliance_membership_tiers t
    where not t.is_invitation_only and t.threshold_points <= c.points
    order by t.threshold_points desc limit 1), 'star_traveler'),
  case
    when c.points >= 200 then now() + interval '1 year'
    when c.points >= 88 then now() + interval '1 year'
    when c.points >= 45 then now() + interval '2 years'
    when c.points >= 10 then now() + interval '2 years'
    else null
  end
from converted c
on conflict (discord_user_id) do nothing;

insert into public.alliance_point_ledger
  (discord_user_id, point_kind, delta, balance_after, source_type, qualifying_amount, note, dedupe_key)
select discord_user_id, 'membership', lifetime_points, lifetime_points, 'legacy_migration',
  qualifying_spend + qualifying_topup, '由深夜與秋奈舊 VIP 累積消費／儲值換算', 'membership:legacy:' || discord_user_id
from public.alliance_members
where lifetime_points > 0
on conflict (dedupe_key) do nothing;

alter table public.alliance_members enable row level security;
alter table public.alliance_membership_tiers enable row level security;
alter table public.alliance_rewards enable row level security;
alter table public.alliance_redemption_requests enable row level security;
alter table public.alliance_point_ledger enable row level security;

drop policy if exists "members read own alliance profile" on public.alliance_members;
create policy "members read own alliance profile" on public.alliance_members for select to authenticated
using (auth_user_id = auth.uid() or public.is_platform_admin(auth.uid()));
drop policy if exists "authenticated read alliance tiers" on public.alliance_membership_tiers;
create policy "authenticated read alliance tiers" on public.alliance_membership_tiers for select to authenticated using (is_active);
drop policy if exists "authenticated read active alliance rewards" on public.alliance_rewards;
create policy "authenticated read active alliance rewards" on public.alliance_rewards for select to authenticated
using (status = 'active' or public.is_platform_admin(auth.uid()));
drop policy if exists "members read own redemptions" on public.alliance_redemption_requests;
create policy "members read own redemptions" on public.alliance_redemption_requests for select to authenticated
using (exists (select 1 from public.alliance_members m where m.discord_user_id = alliance_redemption_requests.discord_user_id and m.auth_user_id = auth.uid()) or public.is_platform_admin(auth.uid()));
drop policy if exists "members read own alliance ledger" on public.alliance_point_ledger;
create policy "members read own alliance ledger" on public.alliance_point_ledger for select to authenticated
using (exists (select 1 from public.alliance_members m where m.discord_user_id = alliance_point_ledger.discord_user_id and m.auth_user_id = auth.uid()) or public.is_platform_admin(auth.uid()));

grant execute on function public.alliance_apply_activity(text, text, text, numeric, text, text) to service_role;
grant execute on function public.alliance_adjust_points(text, text, numeric, text, uuid) to service_role;
grant execute on function public.alliance_request_redemption(text, uuid, bigint, text) to service_role;
grant execute on function public.alliance_review_redemption(uuid, boolean, uuid, text) to service_role;

commit;
