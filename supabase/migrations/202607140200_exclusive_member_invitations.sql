create table if not exists public.alliance_exclusive_invitations (
  id uuid primary key default gen_random_uuid(),
  discord_user_id text not null references public.alliance_members(discord_user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists alliance_exclusive_one_pending_idx
  on public.alliance_exclusive_invitations (discord_user_id)
  where status = 'pending';

create index if not exists alliance_exclusive_member_history_idx
  on public.alliance_exclusive_invitations (discord_user_id, invited_at desc);

alter table public.alliance_exclusive_invitations enable row level security;

drop policy if exists "members read own exclusive invitations"
  on public.alliance_exclusive_invitations;
create policy "members read own exclusive invitations"
  on public.alliance_exclusive_invitations
  for select to authenticated
  using (
    exists (
      select 1
      from public.alliance_members member
      where member.discord_user_id = alliance_exclusive_invitations.discord_user_id
        and member.auth_user_id = auth.uid()
    )
    or public.is_platform_admin(auth.uid())
  );

create or replace function public.alliance_respond_exclusive_invitation(
  p_discord_user_id text,
  p_auth_user_id uuid,
  p_accepted boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.alliance_exclusive_invitations%rowtype;
  member public.alliance_members%rowtype;
begin
  select * into member
  from public.alliance_members
  where discord_user_id = p_discord_user_id
    and auth_user_id = p_auth_user_id
  for update;

  if member.discord_user_id is null then
    raise exception '找不到會員資料';
  end if;

  select * into invitation
  from public.alliance_exclusive_invitations
  where discord_user_id = p_discord_user_id
    and status = 'pending'
  order by invited_at desc
  limit 1
  for update;

  if invitation.id is null then
    raise exception '這份尊享會員邀請已失效或已回覆';
  end if;

  update public.alliance_exclusive_invitations
  set
    status = case when p_accepted then 'accepted' else 'declined' end,
    responded_at = now(),
    updated_at = now()
  where id = invitation.id;

  if p_accepted then
    update public.alliance_members
    set
      tier_key = 'exclusive',
      membership_started_at = now(),
      period_started_at = now(),
      period_points = 0,
      expires_at = now() + interval '1 year',
      updated_at = now()
    where discord_user_id = p_discord_user_id;
  end if;

  return jsonb_build_object(
    'invitationId', invitation.id,
    'accepted', p_accepted,
    'tierKey', case when p_accepted then 'exclusive' else member.tier_key end
  );
end;
$$;

revoke all on function public.alliance_respond_exclusive_invitation(text, uuid, boolean) from public;
grant execute on function public.alliance_respond_exclusive_invitation(text, uuid, boolean) to service_role;
