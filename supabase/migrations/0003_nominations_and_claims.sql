-- Community nominations: neighbors can add businesses they don't own.
-- The BuildBack team reviews each one, invites the owner, and the owner claims the listing.
-- Run after 0002_photos.sql (SQL Editor -> New query -> paste -> Run).

alter table public.businesses
  add column claim_status text not null default 'claimed' check (claim_status in ('claimed', 'unclaimed')),
  add column review_status text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  add column nominated_by uuid references public.profiles (id) on delete set null;

-- Nominated listings are hidden until a reviewer approves them.
drop policy "Anyone can see listed businesses" on public.businesses;
create policy "Anyone can see approved businesses"
  on public.businesses for select using (
    (review_status = 'approved' and not is_hidden)
    or owner_id = auth.uid()
    or nominated_by = auth.uid()
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Private nomination details (only reviewers can read them)
-- ---------------------------------------------------------------------------
create table public.business_nominations (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  nominated_by uuid references public.profiles (id) on delete set null,
  relationship text not null default 'other',
  reason text not null default '',
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_social text,
  invite_code text not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  invited_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.business_nominations enable row level security;

create policy "Reviewers see nominations"
  on public.business_nominations for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Claims: an owner asking to take over a nominated listing
-- ---------------------------------------------------------------------------
create table public.business_claims (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  claimant_name text not null,
  role text not null,
  email text not null,
  phone text,
  note text,
  used_code boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index business_claims_pending_idx on public.business_claims (status, created_at);

alter table public.business_claims enable row level security;

create policy "Claimants and reviewers see claims"
  on public.business_claims for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Functions (they run with extra rights, so each one checks who is calling)
-- ---------------------------------------------------------------------------

-- Add a business you don't own. `listing` holds the public fields, `private` the contact details.
create function public.nominate_business(listing jsonb, private jsonb) returns public.businesses
  language plpgsql security definer set search_path = public as $$
declare
  result public.businesses;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first';
  end if;
  insert into public.businesses (
    owner_id, name, category, kind, ownership_tags, description, city, state, lat, lng,
    image_url, photos, website, phone, claim_status, review_status, nominated_by
  ) values (
    null,
    listing ->> 'name',
    listing ->> 'category',
    coalesce(listing ->> 'kind', ''),
    coalesce(array(select jsonb_array_elements_text(listing -> 'ownership_tags')), '{}'),
    coalesce(listing ->> 'description', ''),
    coalesce(listing ->> 'city', ''),
    coalesce(listing ->> 'state', ''),
    (listing ->> 'lat')::double precision,
    (listing ->> 'lng')::double precision,
    listing ->> 'image_url',
    coalesce(array(select jsonb_array_elements_text(listing -> 'photos')), '{}'),
    listing ->> 'website',
    listing ->> 'phone',
    'unclaimed',
    'pending',
    auth.uid()
  ) returning * into result;

  insert into public.business_nominations (
    business_id, nominated_by, relationship, reason, contact_name, contact_email, contact_phone, contact_social
  ) values (
    result.id, auth.uid(),
    coalesce(private ->> 'relationship', 'other'),
    coalesce(private ->> 'reason', ''),
    private ->> 'contact_name', private ->> 'contact_email', private ->> 'contact_phone', private ->> 'contact_social'
  );
  return result;
end;
$$;

create function public.review_nomination(target uuid, approve boolean) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only reviewers can review nominations';
  end if;
  update public.businesses
     set review_status = case when approve then 'approved' else 'rejected' end
   where id = target and claim_status = 'unclaimed';
end;
$$;

create function public.mark_invited(target uuid) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only reviewers can do that';
  end if;
  update public.business_nominations set invited_at = now() where business_id = target;
end;
$$;

-- Ask to take over a listing. A matching invite code hands it over right away;
-- otherwise the claim waits for a reviewer.
create function public.claim_business(target uuid, claim jsonb) returns text
  language plpgsql security definer set search_path = public as $$
declare
  biz public.businesses;
  expected text;
  given text := upper(trim(coalesce(claim ->> 'code', '')));
  attempts integer;
  matched boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Please sign in first';
  end if;
  select * into biz from public.businesses where id = target for update;
  if biz.id is null or biz.claim_status <> 'unclaimed' then
    raise exception 'This listing has already been claimed';
  end if;

  select count(*) into attempts from public.business_claims where business_id = target and user_id = auth.uid();
  if attempts >= 5 then
    -- Stops anyone from guessing invite codes.
    given := '';
  end if;

  select invite_code into expected from public.business_nominations where business_id = target;
  matched := given <> '' and expected is not null and given = upper(expected);

  insert into public.business_claims (business_id, user_id, claimant_name, role, email, phone, note, used_code, status)
  values (
    target, auth.uid(),
    coalesce(claim ->> 'claimant_name', ''), coalesce(claim ->> 'role', ''), coalesce(claim ->> 'email', ''),
    claim ->> 'phone', claim ->> 'note', matched,
    case when matched then 'approved' else 'pending' end
  );

  if matched then
    update public.businesses
       set owner_id = auth.uid(), claim_status = 'claimed', review_status = 'approved'
     where id = target;
    return 'claimed';
  end if;
  return 'pending';
end;
$$;

create function public.review_claim(target uuid, approve boolean) returns void
  language plpgsql security definer set search_path = public as $$
declare
  c public.business_claims;
begin
  if not public.is_admin() then
    raise exception 'Only reviewers can review claims';
  end if;
  select * into c from public.business_claims where id = target;
  if c.id is null then
    return;
  end if;
  update public.business_claims
     set status = case when approve then 'approved' else 'rejected' end, reviewed_by = auth.uid(), reviewed_at = now()
   where id = target;
  if approve then
    update public.businesses
       set owner_id = c.user_id, claim_status = 'claimed', review_status = 'approved'
     where id = c.business_id;
    update public.business_claims
       set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now()
     where business_id = c.business_id and id <> c.id and status = 'pending';
  end if;
end;
$$;

grant execute on function public.nominate_business(jsonb, jsonb) to authenticated;
grant execute on function public.review_nomination(uuid, boolean) to authenticated;
grant execute on function public.mark_invited(uuid) to authenticated;
grant execute on function public.claim_business(uuid, jsonb) to authenticated;
grant execute on function public.review_claim(uuid, boolean) to authenticated;

-- Only approved listings count toward the community totals.
create or replace function public.community_stats() returns json
  language sql stable security definer set search_path = public as $$
  select json_build_object(
    'businessesHelped', (select count(*) from public.businesses where supporter_count > 0),
    'neighborsHelped', (select count(*) from public.neighbor_requests where supporter_count > 0),
    'members', (select count(*) from public.profiles),
    'wishes', (select count(*) from public.wishes),
    'businessesListed', (select count(*) from public.businesses where review_status = 'approved' and not is_hidden)
  );
$$;
