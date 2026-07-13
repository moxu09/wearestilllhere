alter table public.alliance_members
  add column if not exists custom_display_name text;

alter table public.alliance_members
  drop constraint if exists alliance_members_custom_display_name_length;

alter table public.alliance_members
  add constraint alliance_members_custom_display_name_length
  check (
    custom_display_name is null
    or char_length(btrim(custom_display_name)) between 1 and 30
  );
