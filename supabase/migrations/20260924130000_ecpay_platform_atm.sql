-- Website member orders use the same one-payment-per-order record for card or ATM.
-- Issuing a virtual account does not mark either row as paid.
alter table public.ecpay_platform_payments
  add column if not exists method text not null default 'Credit';
alter table public.ecpay_platform_payments
  drop constraint if exists ecpay_platform_payments_method_check;
alter table public.ecpay_platform_payments
  add constraint ecpay_platform_payments_method_check check (method in ('Credit', 'ATM'));
alter table public.ecpay_platform_payments
  drop constraint if exists ecpay_platform_payments_amount_check;
alter table public.ecpay_platform_payments
  add constraint ecpay_platform_payments_amount_check
  check ((method = 'Credit' and amount between 6 and 199999)
      or (method = 'ATM' and amount between 16 and 49999));

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
     or (v_payment.method = 'Credit' and
         (v_order.payment_method <> 'card' or p_raw_result->>'PaymentType' <> 'Credit'))
     or (v_payment.method = 'ATM' and
         (v_order.payment_method <> 'transfer' or p_raw_result->>'PaymentType' <> 'ATM')) then
    raise exception '網站付款金額、方式或訂單資料不符';
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
