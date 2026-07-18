create table if not exists public.site_content_items (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('activity', 'prize', 'merchandise', 'contact')),
  title text not null,
  subtitle text,
  description text,
  image_url text,
  link_url text,
  price numeric(12, 2) check (price is null or price >= 0),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_content_items_display_idx
  on public.site_content_items (content_type, is_active, sort_order, created_at);

alter table public.site_content_items enable row level security;

create or replace function public.touch_site_content_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_content_items_touch_updated_at on public.site_content_items;
create trigger site_content_items_touch_updated_at
before update on public.site_content_items
for each row execute function public.touch_site_content_updated_at();

insert into public.site_content_items
  (content_type, title, subtitle, description, image_url, link_url, price, sort_order)
select seed.*
from (values
  ('activity', '把今晚的幸運，也一起帶走。', 'Opening lottery', '活動期間每消費滿 1,000 元獲得 1 張抽獎券；前 50 筆滿額訂單抽獎券翻倍，限量 100 張。', null, null, null::numeric, 0),
  ('prize', 'iPhone 17 Pro Max 512G', null, null, '/home/prizes/iphone-17-pro-max.png', null, null::numeric, 10),
  ('prize', 'MacBook Air 512G', null, null, '/home/prizes/macbook-air.png', null, null::numeric, 20),
  ('prize', 'iPad Air 11 512G', null, null, '/home/prizes/ipad-air.png', null, null::numeric, 30),
  ('prize', 'AirPods Max / Pro / Nitro', null, null, '/home/prizes/airpods.png', null, null::numeric, 40),
  ('contact', '前往 Discord', '一般客服與服務安排', null, null, 'https://discord.gg/tXNnXWMHbJ', null::numeric, 10),
  ('contact', 'Instagram', '最新消息與活動', null, null, 'https://www.instagram.com/w.a.s.h.co', null::numeric, 20),
  ('contact', 'Threads', '追蹤我們的日常', null, null, 'https://www.threads.net/@w.a.s.h.co', null::numeric, 30),
  ('contact', '金流問題客服信箱', 'as.co.service@wearestilllhere.com', '儲值、付款、退款或其他金流相關問題，請來信由公司協助處理。', null, 'mailto:as.co.service@wearestilllhere.com', null::numeric, 40)
) as seed(content_type, title, subtitle, description, image_url, link_url, price, sort_order)
where not exists (
  select 1 from public.site_content_items existing
  where existing.content_type = seed.content_type and existing.title = seed.title
);

revoke all on table public.site_content_items from anon, authenticated;
grant all on table public.site_content_items to service_role;

