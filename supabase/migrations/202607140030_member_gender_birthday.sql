alter table public.alliance_members
  add column if not exists gender text,
  add column if not exists birth_month smallint,
  add column if not exists birth_day smallint;

alter table public.alliance_members
  drop constraint if exists alliance_members_gender_valid,
  drop constraint if exists alliance_members_birthday_complete,
  drop constraint if exists alliance_members_birthday_valid;

alter table public.alliance_members
  add constraint alliance_members_gender_valid
    check (gender is null or gender in ('undisclosed', 'female', 'male', 'other')),
  add constraint alliance_members_birthday_complete
    check ((birth_month is null) = (birth_day is null)),
  add constraint alliance_members_birthday_valid
    check (
      birth_month is null
      or (
        birth_month between 1 and 12
        and birth_day between 1 and
          case
            when birth_month = 2 then 29
            when birth_month in (4, 6, 9, 11) then 30
            else 31
          end
      )
    );
