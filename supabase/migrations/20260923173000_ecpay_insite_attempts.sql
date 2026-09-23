-- ECPG 站內付 2.0：同一特店交易編號僅允許送出一次 CreatePayment。
-- 逾時時保留 creating 狀態，須先向綠界核對交易，不可盲目重試扣款。
create table if not exists public.ecpay_insite_attempts (
  merchant_trade_no text primary key check (merchant_trade_no ~ '^[A-Za-z0-9]{1,20}$'),
  payment_kind text not null check (payment_kind in ('service', 'merchandise')),
  attempt_id uuid not null default gen_random_uuid(),
  status text not null default 'token_requested'
    check (status in ('token_requested', 'token_ready', 'creating', 'created', 'token_failed')),
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ecpay_insite_attempts_attempt_id_idx
  on public.ecpay_insite_attempts (attempt_id);
alter table public.ecpay_insite_attempts enable row level security;
revoke all on public.ecpay_insite_attempts from anon, authenticated;
grant all on public.ecpay_insite_attempts to service_role;

create or replace function public.ecpay_insite_claim_create(
  p_merchant_trade_no text,
  p_payment_kind text,
  p_attempt_id uuid
) returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  update public.ecpay_insite_attempts set status = 'creating', updated_at = now()
  where merchant_trade_no = p_merchant_trade_no
    and payment_kind = p_payment_kind
    and attempt_id = p_attempt_id
    and status = 'token_ready'
    and token_expires_at > now();
  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

revoke all on function public.ecpay_insite_claim_create(text, text, uuid) from public, anon, authenticated;
grant execute on function public.ecpay_insite_claim_create(text, text, uuid) to service_role;
