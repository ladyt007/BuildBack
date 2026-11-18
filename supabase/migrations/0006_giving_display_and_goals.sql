-- Goals and giving privacy.
-- Businesses and neighbors choose whether to have a goal, and what their page shows about gifts:
-- amount and supporters, amount only, supporters only, or nothing (private).
-- The raw totals are locked away; the app reads them through functions that respect that choice.
-- Run after 0005_table_permissions.sql (SQL Editor -> New query -> paste -> Run).

alter table public.businesses
  add column goal_amount numeric(12, 2) check (goal_amount is null or (goal_amount > 0 and goal_amount <= 1000000)),
  add column giving_display text not null default 'amount_and_count'
    check (giving_display in ('amount_and_count', 'amount', 'count', 'hidden'));

alter table public.neighbor_requests
  add column giving_display text not null default 'amount_and_count'
    check (giving_display in ('amount_and_count', 'amount', 'count', 'hidden'));

-- Owners set these when listing or editing their business.
grant insert (goal_amount, giving_display), update (goal_amount, giving_display) on public.businesses to authenticated;

-- People asking for help set them when asking, and can change them later (only these two fields).
grant insert (giving_display) on public.neighbor_requests to authenticated;
grant update (goal_amount, giving_display) on public.neighbor_requests to authenticated;
create policy "Owners can change their goal and privacy"
  on public.neighbor_requests for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Lock the raw totals: everyone can read the other columns, but not these two.
-- ---------------------------------------------------------------------------
revoke select on public.businesses from anon, authenticated;
grant select (id, owner_id, name, category, kind, ownership_tags, description, city, state, lat, lng, image_url,
              photos, support_url, website, phone, status, is_pro, featured_until, is_hidden, follower_count,
              created_at, claim_status, review_status, nominated_by, goal_amount, giving_display)
  on public.businesses to anon, authenticated;

revoke select on public.neighbor_requests from anon, authenticated;
grant select (id, owner_id, first_name, title, story, need, goal_amount, fundraiser_url, city, state, lat, lng,
              image_url, status, created_at, giving_display)
  on public.neighbor_requests to anon, authenticated;

-- Totals each person is allowed to see: what the business chose to show, or everything for its owner
-- and for reviewers.
create function public.business_giving(ids uuid[])
  returns table (id uuid, reported_total numeric, supporter_count integer)
  language sql stable security definer set search_path = public as $$
  select b.id,
         case when b.giving_display in ('amount_and_count', 'amount') or b.owner_id = auth.uid() or public.is_admin()
              then b.reported_total end,
         case when b.giving_display in ('amount_and_count', 'count') or b.owner_id = auth.uid() or public.is_admin()
              then b.supporter_count end
    from public.businesses b
   where b.id = any(ids)
     and ((b.review_status = 'approved' and not b.is_hidden)
          or b.owner_id = auth.uid() or b.nominated_by = auth.uid() or public.is_admin());
$$;

create function public.neighbor_giving(ids uuid[])
  returns table (id uuid, reported_total numeric, supporter_count integer)
  language sql stable security definer set search_path = public as $$
  select n.id,
         case when n.giving_display in ('amount_and_count', 'amount') or n.owner_id = auth.uid() or public.is_admin()
              then n.reported_total end,
         case when n.giving_display in ('amount_and_count', 'count') or n.owner_id = auth.uid() or public.is_admin()
              then n.supporter_count end
    from public.neighbor_requests n
   where n.id = any(ids)
     and (n.status in ('approved', 'fulfilled') or n.owner_id = auth.uid() or public.is_admin());
$$;

grant execute on function public.business_giving(uuid[]) to anon, authenticated;
grant execute on function public.neighbor_giving(uuid[]) to anon, authenticated;
