begin;

alter table public.alliance_rewards
  add column if not exists eligible_tier_keys text[];

update public.alliance_rewards
set eligible_tier_keys = array[
  'star_traveler',
  'silver_wing',
  'gold_wing',
  'radiant_star',
  'obsidian',
  'exclusive'
]
where eligible_tier_keys is null or cardinality(eligible_tier_keys) = 0;

alter table public.alliance_rewards
  alter column eligible_tier_keys set default array[
    'star_traveler',
    'silver_wing',
    'gold_wing',
    'radiant_star',
    'obsidian',
    'exclusive'
  ],
  alter column eligible_tier_keys set not null;

alter table public.alliance_rewards
  drop constraint if exists alliance_rewards_eligible_tiers_not_empty;
alter table public.alliance_rewards
  add constraint alliance_rewards_eligible_tiers_not_empty
  check (cardinality(eligible_tier_keys) > 0);

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
  select * into v_member
  from public.alliance_members
  where discord_user_id = p_discord_user_id
  for update;
  if not found then raise exception '找不到聯盟會員'; end if;

  if p_reward_id is null then
    select * into v_settings
    from public.alliance_membership_settings
    where id = 'main';
    v_points := p_discount_points;
    if v_points is null or v_points <= 0 or mod(v_points, v_settings.discount_points_per_asd) <> 0 then
      raise exception '折價積分必須是 % 的正整數倍', v_settings.discount_points_per_asd;
    end if;
    v_discount := v_points / v_settings.discount_points_per_asd;
    v_name := v_discount || ' ASD 折價券';
    v_type := 'discount_coupon';
  else
    select * into v_reward
    from public.alliance_rewards
    where id = p_reward_id and status = 'active'
    for update;
    if not found then raise exception '此兌換商品目前不可兌換'; end if;
    if not (v_member.tier_key = any(v_reward.eligible_tier_keys)) then
      raise exception '此商品不開放給目前的會員等級兌換';
    end if;
    if v_reward.stock is not null and v_reward.stock <= 0 then
      raise exception '此兌換商品已無庫存';
    end if;
    v_points := v_reward.points_cost;
    v_name := v_reward.name;
    v_type := v_reward.reward_type;
  end if;

  if v_member.reward_points < v_points then raise exception '獎勵積分不足'; end if;

  update public.alliance_members
  set reward_points = reward_points - v_points, updated_at = now()
  where discord_user_id = p_discord_user_id
  returning * into v_member;

  insert into public.alliance_point_ledger
    (discord_user_id, point_kind, delta, balance_after, source_type, note)
  values
    (p_discord_user_id, 'reward', -v_points, v_member.reward_points, 'redemption_pending', v_name);

  if p_reward_id is not null and v_reward.stock is not null then
    update public.alliance_rewards
    set stock = stock - 1, updated_at = now()
    where id = p_reward_id;
  end if;

  insert into public.alliance_redemption_requests
    (discord_user_id, reward_id, reward_name, reward_type, points_spent, discount_amount, request_note)
  values
    (p_discord_user_id, p_reward_id, v_name, v_type, v_points, v_discount, p_request_note)
  returning * into v_request;
  return v_request;
end;
$$;

create table if not exists public.legacy_vip_backfill_queue (
  guild_id text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error text,
  primary key (guild_id, user_id)
);

create table if not exists public.app_migration_markers (
  migration_key text primary key,
  applied_at timestamptz not null default now()
);

create temporary table legacy_vip_backfill_deltas on commit drop as
select
  source_guild_id as guild_id,
  discord_user_id as user_id,
  sum(case when source_type = 'spend' then qualifying_amount else 0 end) as spent_delta,
  sum(case when source_type = 'topup' then qualifying_amount else 0 end) as topup_delta,
  max(case when source_type = 'topup' then greatest(qualifying_amount, 0) else 0 end) as highest_topup
from public.alliance_point_ledger
where point_kind = 'membership'
  and not exists (
    select 1 from public.app_migration_markers
    where migration_key = 'dual-vip-ledger-backfill-20260714'
  )
  and source_guild_id in ('1501098191813214312', '1206138511535898654')
  and (
    (source_type = 'spend' and source_key like 'order:%')
    or
    (source_type = 'topup' and (
      source_key like 'topup:%'
      or source_key like 'dispatch-topup:%'
    ))
  )
group by source_guild_id, discord_user_id;

insert into public.user_vips (
  guild_id,
  user_id,
  total_spent,
  total_topup,
  highest_single_topup,
  updated_at
)
select
  guild_id,
  user_id,
  greatest(spent_delta, 0),
  greatest(topup_delta, 0),
  greatest(highest_topup, 0),
  now()
from legacy_vip_backfill_deltas
on conflict (guild_id, user_id) do update set
  total_spent = greatest(0, public.user_vips.total_spent + excluded.total_spent),
  total_topup = greatest(0, public.user_vips.total_topup + excluded.total_topup),
  highest_single_topup = greatest(
    public.user_vips.highest_single_topup,
    excluded.highest_single_topup
  ),
  updated_at = now();

insert into public.legacy_vip_backfill_queue (guild_id, user_id)
select guild_id, user_id
from legacy_vip_backfill_deltas
on conflict (guild_id, user_id) do nothing;

insert into public.app_migration_markers (migration_key)
values ('dual-vip-ledger-backfill-20260714')
on conflict (migration_key) do nothing;

grant select, update on public.legacy_vip_backfill_queue to service_role;
grant execute on function public.alliance_request_redemption(text, uuid, bigint, text) to service_role;

commit;
