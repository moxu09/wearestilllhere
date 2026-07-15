alter table public.alliance_members
  add column if not exists exclusive_card_variant text;

alter table public.alliance_members
  drop constraint if exists alliance_members_exclusive_card_variant_valid;

alter table public.alliance_members
  add constraint alliance_members_exclusive_card_variant_valid
  check (exclusive_card_variant is null or exclusive_card_variant in ('white', 'black'));

comment on column public.alliance_members.exclusive_card_variant is
  'One-time exclusive membership card choice: white or black.';

create or replace function public.prevent_exclusive_card_variant_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.exclusive_card_variant is not null
    and new.exclusive_card_variant is distinct from old.exclusive_card_variant then
    raise exception '尊享會員卡面只能選擇一次，確認後無法更改';
  end if;
  return new;
end;
$$;

drop trigger if exists alliance_members_lock_exclusive_card_variant
  on public.alliance_members;

create trigger alliance_members_lock_exclusive_card_variant
before update of exclusive_card_variant on public.alliance_members
for each row execute function public.prevent_exclusive_card_variant_change();
