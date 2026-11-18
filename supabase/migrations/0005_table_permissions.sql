-- Table permissions for the app.
-- Newer Supabase projects don't give the app's roles access to new tables automatically,
-- so this grants exactly what the app needs. Row-level security (from the earlier files)
-- still decides which rows each person can see or change.
-- Run after 0004_reported_totals.sql (SQL Editor -> New query -> paste -> Run).

grant usage on schema public to anon, authenticated;

-- Anyone, signed in or not, can browse public listings.
grant select on public.businesses, public.status_updates, public.neighbor_requests, public.wishes, public.sponsors
  to anon, authenticated;

-- Signed-in members only (row-level security limits these to their own rows, or to reviewers).
grant select on public.profiles, public.follows, public.supports, public.business_nominations, public.business_claims
  to authenticated;

grant insert, delete on public.wishes to authenticated;
grant insert, delete on public.follows to authenticated;
grant insert on public.supports to authenticated;
grant insert on public.status_updates to authenticated;

-- Column-level grants from earlier files (re-stated so this file is complete on its own).
grant update (display_name, home_lat, home_lng, home_label, avatar_url) on public.profiles to authenticated;
grant insert (owner_id, name, category, kind, ownership_tags, description, city, state, lat, lng,
              image_url, photos, support_url, website, phone, status)
  on public.businesses to authenticated;
grant update (name, category, kind, ownership_tags, description, city, state, lat, lng,
              image_url, photos, support_url, website, phone, status)
  on public.businesses to authenticated;
grant insert (owner_id, first_name, title, story, need, goal_amount, fundraiser_url, city, state, lat, lng, image_url)
  on public.neighbor_requests to authenticated;

-- Functions the app calls.
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.community_stats() to anon, authenticated;
grant execute on function public.review_neighbor_request(uuid, boolean) to authenticated;
grant execute on function public.nominate_business(jsonb, jsonb) to authenticated;
grant execute on function public.review_nomination(uuid, boolean) to authenticated;
grant execute on function public.mark_invited(uuid) to authenticated;
grant execute on function public.claim_business(uuid, jsonb) to authenticated;
grant execute on function public.review_claim(uuid, boolean) to authenticated;
