-- Website companion orders: one ECPay credit-card attempt per order.
-- Card payment is settled only by the verified ECPG server callback.
create table if not exists public.ecpay_platform_payments (
  merchant_trade_no text primary key check (merchant_trade_no ~ '^[A-Za-z0-9]{1,20}$'),
  platform_order_id uuid not null unique references public.platform_orders(id) on delete restrict,
  customer_user_id uuid not null references auth.users(id) on delete restrict,
  amount integer not null check (amount between 6 and 199999),
  status text not null default 'pending' check (status in ('pending', 'paid')),
  trade_no text unique,
  paid_at timestamptz,
  raw_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ecpay_platform_payments_customer_idx
  on public.ecpay_platform_payments(customer_user_id, created_at desc);
alter table public.ecpay_platform_payments
  add column if not exists site_origin text not null default 'https://www.wearestilllhere.com'
  check (site_origin in ('https://wearestilllhere.com', 'https://www.wearestilllhere.com'));
alter table public.ecpay_platform_payments enable row level security;
revoke all on public.ecpay_platform_payments from anon, authenticated;
grant all on public.ecpay_platform_payments to service_role;

alter table public.ecpay_insite_attempts
  drop constraint if exists ecpay_insite_attempts_payment_kind_check;
alter table public.ecpay_insite_attempts
  add constraint ecpay_insite_attempts_payment_kind_check
  check (payment_kind in ('service', 'merchandise', 'platform'));

create or replace function public.ecpay_mark_platform_paid(
  p_merchant_trade_no text,
  p_trade_no text,
  p_amount integer,
  p_payment_date text,
  p_raw_result jsonb
) returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_payment public.ecpay_platform_payments%rowtype;
  v_order public.platform_orders%rowtype;
begin
  if p_trade_no !~ '^[A-Za-z0-9]{1,20}$' then
    raise exception '綠界交易編號格式錯誤';
  end if;
  select * into v_payment from public.ecpay_platform_payments
    where merchant_trade_no = p_merchant_trade_no for update;
  if not found then raise exception '找不到網站付款單'; end if;
  select * into v_order from public.platform_orders
    where id = v_payment.platform_order_id for update;
  if not found then raise exception '找不到網站訂單'; end if;
  if v_payment.amount <> p_amount or v_order.total_amount <> p_amount
     or v_payment.customer_user_id <> v_order.customer_user_id
     or v_order.payment_method <> 'card' then
    raise exception '網站付款金額或訂單資料不符';
  end if;
  if v_payment.status = 'paid' then
    if v_payment.trade_no = p_trade_no and v_order.payment_status = 'paid'
       and v_order.paid_amount = p_amount then
      return false;
    end if;
    raise exception '付款單已使用其他交易核帳';
  end if;
  if v_order.payment_status <> 'unpaid' or v_order.status <> 'pending_payment'
     or v_order.paid_amount <> 0 then
    raise exception '網站訂單已付款或已取消，不能核帳';
  end if;
  update public.ecpay_platform_payments
    set status = 'paid', trade_no = p_trade_no, paid_at = now(),
        raw_result = coalesce(p_raw_result, '{}'::jsonb), updated_at = now()
    where merchant_trade_no = p_merchant_trade_no;
  update public.platform_orders
    set payment_status = 'paid', paid_amount = p_amount,
        status = 'paid', updated_at = now()
    where id = v_payment.platform_order_id;
  return true;
end;
$$;

revoke all on function public.ecpay_mark_platform_paid(text, text, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.ecpay_mark_platform_paid(text, text, integer, text, jsonb)
  to service_role;
