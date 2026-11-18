-- Safety tools and account deletion (required by the App Store and Google Play):
-- people can report content, block other users, and delete their own account.
-- Run after 0006_giving_display_and_goals.sql (SQL Editor -> New query -> paste -> Run).

-- ---------------------------------------------------------------------------
-- Reports: anyone signed in can flag a business, help request, update or person
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in ('business', 'neighbor', 'update', 'user')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 60),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_open_idx on public.reports (status, created_at);

alter table public.reports enable row level security;

create policy "Members can report" on public.reports for insert with check (reporter_id = auth.uid());
create policy "Reviewers see reports" on public.reports for select using (public.is_admin());

grant insert (reporter_id, target_type, target_id, reason, details) on public.reports to authenticated;
grant select on public.reports to authenticated;

-- A reviewer either hides the reported content or dismisses the report.
create function public.resolve_report(target uuid, hide boolean) returns void
  language plpgsql security definer set search_path = public as $$
declare
  r public.reports;
begin
  if not public.is_admin() then
    raise exception 'Only reviewers can resolve reports';
  end if;
  select * into r from public.reports where id = target;
  if r.id is null then
    return;
  end if;
  if hide then
    if r.target_type = 'business' then
      update public.businesses set is_hidden = true where id = r.target_id;
    elsif r.target_type = 'neighbor' then
      update public.neighbor_requests set status = 'rejected' where id = r.target_id;
    elsif r.target_type = 'update' then
      delete from public.status_updates where id = r.target_id;
    end if;
  end if;
  -- Close every open report about the same thing.
  update public.reports
     set status = case when hide then 'resolved' else 'dismissed' end, resolved_by = auth.uid(), resolved_at = now()
   where target_type = r.target_type and target_id = r.target_id and status = 'open';
end;
$$;

-- ---------------------------------------------------------------------------
-- Blocks: hide everything from a person you don't want to see
-- ---------------------------------------------------------------------------
create table public.blocks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  blocked_user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blocked_user_id),
  check (user_id <> blocked_user_id)
);

alter table public.blocks enable row level security;

create policy "Members see their blocks" on public.blocks for select using (user_id = auth.uid());
create policy "Members block" on public.blocks for insert with check (user_id = auth.uid());
create policy "Members unblock" on public.blocks for delete using (user_id = auth.uid());

grant select, insert, delete on public.blocks to authenticated;

-- If a reviewer deletes their account, keep the requests and claims they reviewed.
alter table public.neighbor_requests
  drop constraint neighbor_requests_reviewed_by_fkey,
  add constraint neighbor_requests_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles (id) on delete set null;
alter table public.business_claims
  drop constraint business_claims_reviewed_by_fkey,
  add constraint business_claims_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Delete my account: removes the person and everything they own.
-- (Their photos are removed by the app first, through the storage API.)
-- ---------------------------------------------------------------------------
create function public.delete_my_account() returns void
  language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Please sign in first';
  end if;
  -- Businesses they own go too (their updates, follows and nominations go with them).
  delete from public.businesses where owner_id = me;
  -- Removing the login removes the profile, and with it their help requests, wishes, follows,
  -- gifts, claims and blocks.
  delete from auth.users where id = me;
end;
$$;

grant execute on function public.resolve_report(uuid, boolean) to authenticated;
grant execute on function public.delete_my_account() to authenticated;
