update public.alliance_members as member
set
  display_name = profile.display_name,
  updated_at = now()
from public.platform_profiles as profile
where profile.discord_user_id = member.discord_user_id
  and nullif(btrim(member.display_name), '') is null
  and nullif(btrim(profile.display_name), '') is not null;
