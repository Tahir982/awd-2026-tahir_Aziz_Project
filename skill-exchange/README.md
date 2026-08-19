# Campus Skill Exchange

A peer-to-peer platform where students list skills they can teach, browse what
others offer, book time slots, chat, and leave reviews after a session.

## Tech stack

- **Next.js 14** (App Router, Server Components, Server Actions) — TypeScript
- **Supabase** — Postgres database, Auth, Row Level Security, Realtime
- **Tailwind CSS** — styling
- **Zod** — server-side input validation on every form submission

## Project structure

```
app/
  layout.tsx              Root layout, navbar, font loading
  page.tsx                Landing page
  login/, register/       Auth pages
  skills/page.tsx         Browse + search + filter listings
  skills/new/page.tsx     Create a listing
  skills/[id]/page.tsx    Listing detail, slots, booking, reviews
  dashboard/page.tsx      My listings + my bookings (as learner & owner)
  admin/page.tsx          Moderation queue (admin-only)
components/               Client components (forms, cards, buttons)
lib/
  actions/                Server Actions (auth, skills, bookings, admin)
  supabase/                Supabase client factories (browser/server/admin)
  validation.ts            Zod schemas — the real security gate on all input
middleware.ts              Session refresh + route protection + admin check
supabase/schema.sql         Full DB schema + Row Level Security policies
```

## Setup

1. **Create a Supabase project** at supabase.com (free tier is enough).

2. **Run the schema**: open Supabase Dashboard → SQL Editor → paste the
   contents of `supabase/schema.sql` → Run. This creates every table,
   trigger, and Row Level Security policy.

3. **Copy environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from Project Settings → API. Only add `SUPABASE_SERVICE_ROLE_KEY` if you
   extend the admin actions to need it — keep it out of any client code.

4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
   Visit http://localhost:3000

5. **Make yourself an admin** (optional, for the moderation dashboard):
   in the Supabase SQL Editor, after signing up in the app:
   ```sql
   update public.profiles set is_admin = true where id = 'your-user-uuid';
   ```

## Security notes (what to point to in your report/demo)

- **Row Level Security is the real authorization layer.** Every table has
  RLS enabled; policies check `auth.uid()` against ownership before allowing
  select/insert/update/delete. The app's own code is a second line of
  defense, not the only one — even a compromised client can't read or write
  data it isn't entitled to.
- **All input is re-validated server-side** with Zod in `lib/validation.ts`,
  even though the HTML forms also have basic client-side constraints —
  client validation is UX only and can always be bypassed.
- **Admin routes are checked twice**: once in `middleware.ts` before the page
  renders, and again inside every admin Server Action (`assertAdmin()`),
  since Server Actions can be invoked directly and shouldn't assume a user
  reached them through the protected page.
- **Double-booking is prevented at the database level** via a Postgres
  trigger (`mark_slot_booked`), not just application logic — this closes the
  race condition where two users book the same slot at once.
- **Security headers** (CSP, X-Frame-Options, etc.) are set in
  `next.config.mjs`.
- The service role key (which bypasses RLS) is never imported into any file
  reachable from the browser.

## Not yet built (natural extensions)

- Realtime chat currently uses polling via revalidation; wire up
  `supabase.channel()` for live updates.
- Email notifications on booking status changes (Supabase + Resend/SendGrid).
- Image uploads for profiles/listings via Supabase Storage.
- Pagination on the browse page for large listing counts.
