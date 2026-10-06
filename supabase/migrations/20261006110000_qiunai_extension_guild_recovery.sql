-- Restore only verified Qiunai extension ownership; never manufacture a paid result.
begin;
create or replace function public.qiunai_fill_extension_guild()
returns trigger language plpgsql set search_path = public, pg_temp as $$
declare parent_guild text; parent_customer text;
begin
  if new.guild_id is null then
    select guild_id, customer_id into parent_guild, parent_customer
    from public.play_orders where id::text = new.order_id::text;
    if parent_guild = '1206138511535898654'
       and parent_customer is not distinct from new.customer_id then
      new.guild_id := parent_guild;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists qiunai_extension_guild_fill on public.order_extensions;
create trigger qiunai_extension_guild_fill
before insert or update of guild_id, order_id, customer_id on public.order_extensions
for each row execute function public.qiunai_fill_extension_guild();
revoke all on function public.qiunai_fill_extension_guild() from public, anon, authenticated;

-- Exact failed records verified against parent organization, customer and settled amount.
update public.order_extensions e set guild_id = o.guild_id, updated_at = now()
from public.play_orders o, public.ecpay_service_payments p
where e.id in (241,242,245) and e.guild_id is null
  and o.id::text = e.order_id::text and o.guild_id = '1206138511535898654'
  and e.customer_id = o.customer_id and p.user_id = e.customer_id
  and p.organization_code = 'qiunai' and p.payment_kind = 'extension'
  and p.entity_key = e.id::text and p.status = 'paid' and p.paid_at is not null
  and p.amount = e.amount and not coalesce(e.paid,false)
  and e.status = 'waiting_payment';
commit;
select count(*) as recovered_extension_ownership
from public.order_extensions where id in (241,242,245) and guild_id = '1206138511535898654';
