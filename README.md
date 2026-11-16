# BuildBack

**Build back communities — one store at a time, one person at a time.**

BuildBack helps neighborhoods find and support local businesses, lift up neighbors going through hard times, and
tell the world what their community is missing.

- 🏪 **Businesses** — find businesses near you (any kind; filter by Black-owned, woman-owned, veteran-owned and more),
  follow them, read their status updates and support them directly.
- 💛 **Build Our Neighbors** — people in need share their story and link their own fundraiser. Every request is
  reviewed before it's public.
- ✨ **Wishes** — "No Black barber within 30 miles." "We want an Irish pub." Wishes are grouped by area so business
  owners and future entrepreneurs can see real demand.
- 🔭 **Nominations** — anyone can add a business they love, even if it isn't theirs. The team reviews it, sends
  the owner a claim link with a one-time code, and the owner takes over the listing in a minute. Owners without a
  code can submit a claim that the team verifies by hand.
- 🏆 **Impact** — a brick wall that grows with every life you build up, a giving meter with tiers
  (Generous Heart $50, Big Heart $250, Community Pillar $1,000), points, levels, badges, and celebrations
  (confetti and money rain) when you give, list a business or nominate one.

After giving, people tap how much they gave ($5–$100 or their own amount). It's optional and self-reported:
their exact gifts are private, and each business or neighbor page shows the anonymous total ("$1,020 given by
24 neighbors through BuildBack") with a bar toward a neighbor's goal.

BuildBack never handles donations. Gifts go straight to each business's or person's own payment or fundraiser link.

One codebase runs on **iPhone, Android and the web**, built with [Expo](https://expo.dev) (React Native + TypeScript)
and [Supabase](https://supabase.com).

---

## Try it in 2 minutes

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run web        # opens in your browser
npm start          # then scan the QR code with the Expo Go app on your phone
```

Without Supabase settings the app runs in **preview mode** with sample businesses, saved only on your device. In
preview mode every account can use the review queue (Me → Review help requests) so you can try it.

## Project layout

```
src/app/          Screens. Each file is a page (Expo Router). (tabs)/ holds the bottom tabs.
src/components/   Shared pieces: cards, buttons, the celebration overlay, location picker
src/data/         The backend interface, plus demo (on-device) and Supabase implementations
src/lib/          Theme, categories, points and badges, location helpers
src/state/        App-wide state: account, location, follows, gifts
supabase/         Database schema
legacy/           The original 2020 Swift/iOS app, kept for reference
scripts/          generate-logo.py redraws the logo, app icons and opening-animation layers
```

## Connect the real database (Supabase)

Step-by-step guide: **[docs/supabase-setup.md](docs/supabase-setup.md)**. Short version:

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, open **SQL Editor → New query**, paste the contents of
   `supabase/migrations/0001_initial_schema.sql`, and click **Run**. Do the same with
   `0002_photos.sql` (profile and business photos), `0003_nominations_and_claims.sql`
   (community nominations and claiming listings) and `0004_reported_totals.sql` (giving totals), in that
   order.
3. Copy `.env.example` to `.env`, then fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from
   **Project Settings → API**.
4. Restart `npm run web`. The preview banner disappears once you're connected.
5. Make yourself a reviewer: sign up in the app, then in **Table Editor → profiles** set `is_admin` to `true` on your
   row.

## Reviewing (Me → Review requests)

Reviewers (`is_admin` in `profiles`) see four queues:

1. **New nominations** — approve real, local businesses; they go live as a "Community pick".
2. **Invite the owner** — email, text or copy a ready-made message with the owner's claim link and invite code.
   The link hands them the listing as soon as they sign up.
3. **Claims to verify** — people who say they run a business but had no code. Contact the business using the
   nomination's details or its public website (not the details in the claim) before approving.
4. **Help requests** — check each story and fundraiser link before it's shared.

## Publish

### Website (Netlify)

Connect this repository in Netlify. `netlify.toml` already has the build settings. Add the same `EXPO_PUBLIC_…`
values from your `.env` under **Site configuration → Environment variables**.

### iPhone and Android (no Mac needed)

Expo's cloud service (EAS) builds, signs and submits the apps.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios       # App Store (needs an Apple Developer account, $99/yr)
npx eas-cli@latest submit --platform android   # Google Play (needs a Play Console account, $25 once)
```

Before the first store build:

- Pick your permanent app ID. It's set to `app.buildback.community` in `app.json` (`ios.bundleIdentifier` and
  `android.package`) and can't be changed after the app is published.
- Add your `EXPO_PUBLIC_…` values as EAS environment variables (`npx eas-cli@latest env:create`).

## Money: how BuildBack earns

Listing is always free. Optional paid plans (screen: **Me → Grow your business**):

| Plan | Suggested price | What they get |
| --- | --- | --- |
| Featured listing | $15/week | Top of local feeds, gold "Featured" badge |
| BuildBack Pro | $12/month | Demand insights, verified badge, stats, deals |
| Community Sponsor | from $99/month | A sponsor card in local feeds (no ad networks) |

Create a [Stripe Payment Link](https://stripe.com/payments/payment-links) for each plan and put the URLs in `.env`.
Payments happen on the web, so there's no app store commission. After a payment, set `featured_until` or `is_pro` on the
business in Supabase. Automating this with a Stripe webhook is on the roadmap.

## Roadmap

- [ ] Photos on help requests
- [ ] Verified giving totals: let businesses connect their own Stripe account (Stripe Connect) so gifts are
      recorded automatically and exactly, instead of self-reported
- [ ] Stripe webhook to switch on Featured/Pro automatically after payment
- [ ] Pro "demand insights" dashboard for business owners
- [ ] Notify people who wished for something when a matching business opens nearby
- [ ] Push notifications for updates from businesses you follow
- [ ] Universal links so shared links open straight in the app
- [ ] Store our own ZIP code table instead of the free Zippopotam.us lookup
