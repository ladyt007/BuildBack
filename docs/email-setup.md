# Setting up email for BuildBack (Resend)

**Why:** Supabase's built-in email only sends sign-up confirmations to members of your Supabase team. To let
anyone sign up, BuildBack needs its own email sender. Resend is free for up to 3,000 emails a month
(100 a day).

**What you need first:** your own web address (domain), e.g. `buildbackcommunity.com`. Resend will only send
from an address at a domain you own. Without one it only sends to your own inbox.

Time: about 30 minutes, plus up to a few hours waiting for the domain to "verify".

---

## 1. Get a domain (about $12–20 a year)

The easiest place is **Netlify**, because your website is already there and it sets everything up for you.

1. Go to **app.netlify.com** → open the **buildback-community** project.
2. Click **Domain management** → **Add a domain** → **Register a new domain**.
3. Search for a name. Ideas: `buildbackcommunity.com`, `buildbackapp.com`, `joinbuildback.com`,
   `buildback.community`. Pick one that's available and buy it.
4. Netlify connects it to your site automatically. In a few minutes, the site works at your new address too.

Tell me the domain you bought. I'll switch the app's share links, contact emails and claim links to it.

## 2. Create your Resend account

1. Go to **resend.com** → **Get started**. Sign up with your email (skip any "connect GitHub" option).
2. Confirm your email address.

## 3. Add your domain to Resend

1. In Resend, click **Domains** → **Add domain**.
2. Type your domain (e.g. `buildbackcommunity.com`). Region: **North Virginia (us-east-1)**. Click **Add**.
3. Resend shows a list of **DNS records** (usually 3–4 lines with Type, Name and Value). Leave this page open.

## 4. Copy those records into Netlify

1. In another tab, go to **app.netlify.com** → **Domains** (top menu) → click your domain.
2. Click **Add new record** for **each** line Resend showed you:
   - **Record type:** same as Resend's **Type** (TXT or MX).
   - **Name:** same as Resend's **Name** (e.g. `resend._domainkey` or `send`). Netlify adds your domain
     on the end automatically, so type only the part Resend shows.
   - **Value:** copy Resend's **Value** exactly.
   - **Priority** (MX records only): use the number Resend shows (usually `10`).
3. Back in Resend, click **Verify DNS records**. It can take a few minutes to a few hours. When the domain
   says **Verified** (green), continue.

## 5. Create a Resend API key

1. In Resend, click **API Keys** → **Create API key**.
2. Name: `Supabase`. Permission: **Sending access**. Domain: your domain. Click **Add**.
3. Copy the key (it starts with `re_`). **This one is secret.** Don't send it to me or anyone. You'll paste it
   straight into Supabase in the next step, and you can always make a new one if needed.

## 6. Connect Resend to Supabase

1. In Supabase: **Authentication** → **Emails** → **SMTP Settings** (it may be a tab at the top).
2. Turn on **Enable custom SMTP** and fill in:

   | Field | Value |
   | --- | --- |
   | Sender email | `hello@yourdomain.com` (use your real domain) |
   | Sender name | `BuildBack` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | the `re_…` key from step 5 |

3. Click **Save**.
4. Go to **Authentication** → **Rate Limits** and set **emails per hour** to `100` (the default is very low).
   Click **Save**.

## 7. Test it

1. In a private/incognito browser window, open the BuildBack website and sign up with a **different** email
   address (a friend's, or a second address of yours).
2. The confirmation email should arrive from **BuildBack**. Check spam the first time.
3. Tap the link. It should open BuildBack, signed in.

If the email doesn't arrive, check **Resend → Logs** to see what happened, and send me a screenshot.

---

## Optional: make the emails look like BuildBack

In Supabase → **Authentication** → **Emails** → **Templates** you can edit the "Confirm signup" email. I can
write a friendly, branded version for you when you're ready.

## Quick alternative while you get a domain

If you want friends to try the app before the domain is ready, you can turn off email confirmation:
Supabase → **Authentication** → **Sign In / Providers** → **Email** → turn **Confirm email** off → **Save**.
People can then sign up without an email link. The downside is that anyone could sign up with a fake email
address, so turn it back on once Resend is working.
