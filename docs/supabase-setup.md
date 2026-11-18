# Setting up Supabase for BuildBack

Supabase is the database behind BuildBack. Until it's connected, the app runs in **preview mode**: sample
businesses, and everything saved only on each person's own device. Connecting it makes accounts, businesses,
wishes, photos and giving totals real and shared between everyone.

It takes about 20 minutes and the free plan is enough to launch.

---

## 1. Create your Supabase project

1. Go to **supabase.com** and click **Start your project**. Sign up with your email.
   - Supabase offers to **connect GitHub** (when signing up, when creating a project, and under
     Project Settings → Integrations). **Skip it.** BuildBack doesn't use it — the database is set up by
     pasting files into the SQL Editor (step 2).
2. Click **New project** and fill in:
   - **Name:** `buildback`
   - **Database password:** click **Generate a password** and save it in your password manager.
     You won't need it day to day, and **never share it with anyone** (including me).
   - **Region:** the one closest to most of your users, e.g. **East US (North Virginia)**.
   - **Plan:** Free.
3. Click **Create new project** and wait a minute or two while it sets up.

## 2. Create the database tables

Everything the database needs is in **one file: `supabase/setup-all.sql`** (it combines the files in
`supabase/migrations/`, in order).

> Already ran an older `setup-all.sql`? Just run `supabase/migrations/0005_table_permissions.sql` the same way.

1. Open `setup-all.sql` and copy **all** of it (on a computer: click inside it, press Ctrl+A / Cmd+A, then
   Ctrl+C / Cmd+C).
2. In Supabase, click **SQL Editor** in the left menu, then **New query** (or the **+** button).
3. Click in the big empty box and paste.
4. Click **Run** (bottom right, or Ctrl+Enter / Cmd+Enter).
5. If Supabase warns about "destructive operations", click **Run this query** — that's expected.
6. You should see **Success. No rows returned**.

If you see a red error instead, send me the message. Nothing will have been changed (the file runs as one
all-or-nothing step), so it's safe to run again once it's fixed.

## 3. Turn on email sign-ups

1. Click **Authentication** in the left menu → **Sign In / Providers** (or **Providers**).
2. Make sure **Email** is turned on.
3. Leave **Confirm email** turned **on**. People will get an email with a link to confirm their account before
   they can sign in. This stops fake accounts.
4. Go to **Authentication → URL Configuration**:
   - **Site URL:** `https://buildback-community.netlify.app`
   - **Redirect URLs:** click **Add URL** and add `https://buildback-community.netlify.app/**`
     and `buildback://**` (the second one is for the phone apps).
   - Click **Save**.

> Supabase's built-in email sender only sends a few emails per hour. That's fine for testing. Before a big
> launch, connect a proper email service under **Authentication → Emails → SMTP Settings** (Resend and
> Postmark both have free tiers). I can help with that when you're ready.

## 4. Copy your two connection values

1. Click the **gear icon (Project Settings)** at the bottom of the left menu → **API** (some dashboards call
   it **API Keys** or **Data API**).
2. Copy these two values:
   - **Project URL** — looks like `https://abcdefghijklm.supabase.co`
   - **anon public** key (newer dashboards call it the **publishable** key) — a long string starting with
     `eyJ…` or `sb_publishable_…`

**Only copy those two.** On the same page there's a **service_role** (or **secret**) key. Never share that one
or put it in the app — it bypasses all the security rules.

The Project URL and anon/publishable key are safe to share: they're built into the app that everyone
downloads anyway. The database's security rules (from step 2) are what keep data safe.

## 5. Send them to me

Paste the **Project URL** and the **anon / publishable key** into our chat. I'll:

1. Put them into the app's settings and the website's settings on Netlify.
2. Rebuild and redeploy the website so it uses the real database.
3. Test signing up, listing a business and uploading a photo against your real project.

(To test it from here I'll ask you to approve one more network address — your project's `….supabase.co`
address.)

## 6. Make yourself a reviewer

Once the live site is connected:

1. Go to `https://buildback-community.netlify.app`, create your account and click the link in the
   confirmation email.
2. In Supabase, open **SQL Editor → New query**, paste this with **your** email address, and click **Run**:

   ```sql
   update public.profiles set is_admin = true where email = 'your-email@example.com';
   ```

3. Sign out and back in on the app. **Me → Review requests** now shows nominations, claims and help requests.

Add any teammates the same way, with their email addresses.

---

## Good to know

- **Free plan limits:** 500 MB of data, 1 GB of photos, 50,000 monthly active users. Plenty to launch.
- **Pausing:** free projects pause after a week with no activity. Opening the dashboard (or any visit to the
  app) wakes it up. The **Pro plan ($25/month)** never pauses and includes daily backups — worth it once real
  people rely on BuildBack.
- **Starting empty:** the live app has no sample businesses. Start by listing a few businesses yourself, or
  nominating ones you love, so the first visitors see something near them.
- **Where things live:** Table Editor shows all your data. Storage → `photos` holds uploaded pictures.
  Authentication → Users lists everyone who signed up.
