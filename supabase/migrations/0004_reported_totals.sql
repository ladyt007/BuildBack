-- Running totals of what givers report giving through BuildBack.
-- These are self-reported (BuildBack never handles the money), so the app labels them that way.
-- Run after 0003_nominations_and_claims.sql (SQL Editor -> New query -> paste -> Run).

alter table public.businesses add column reported_total numeric(12, 2) not null default 0;
alter table public.neighbor_requests add column reported_total numeric(12, 2) not null default 0;

-- Counts each person once per business or neighbor, and adds every reported amount to the total.
create or replace function public.sync_supporter_count() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  first_time boolean := not exists (
    select 1 from public.supports
     where user_id = new.user_id and target_id = new.target_id and id <> new.id
  );
  added numeric := coalesce(new.amount, 0);
begin
  if new.target_type = 'business' then
    update public.businesses
       set supporter_count = supporter_count + case when first_time then 1 else 0 end,
           reported_total = reported_total + added
     where id = new.target_id;
  else
    update public.neighbor_requests
       set supporter_count = supporter_count + case when first_time then 1 else 0 end,
           reported_total = reported_total + added
     where id = new.target_id;
  end if;
  return null;
end;
$$;

-- A single report can't be absurdly large (keeps typos like $25000 instead of $25.00 in check).
alter table public.supports add constraint supports_amount_reasonable check (amount is null or amount <= 10000);
