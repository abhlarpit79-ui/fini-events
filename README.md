# FINI Events – Phase 1

Free event-listing and registration portal for parents of 0–3 year olds.
Professionals list events → parents discover them (web + WhatsApp broadcast) → parents register with mobile OTP → professionals see registrations and mark attendance. No payments, no commission.

Stack: Next.js 16 (App Router) · Supabase (Postgres, Auth, Storage) · Tailwind v4 · Vercel.

---

## 1. One-time setup (≈ 30 minutes)

### A. Supabase project
1. Go to https://supabase.com → **New project** (region: Mumbai `ap-south-1`). Note the database password.
2. **SQL Editor → New query** → paste the whole of `supabase/migrations/0001_init.sql` → **Run**. This creates all tables, security policies, the registration function and the two storage buckets.
3. **Project Settings → API**: copy `Project URL`, `anon public` key and `service_role` key.

### B. Phone OTP for parents
Supabase sends OTPs through an SMS provider you connect:
1. **Authentication → Providers → Phone** → enable.
2. Choose a provider. Supabase natively supports **Twilio, Twilio Verify, Vonage, MessageBird and Textlocal**. For India, **Textlocal** (Indian DLT-registered sender, lowest per-SMS cost) or **Twilio** (simplest onboarding) are the practical choices. Enter the credentials.
   - DLT: for Indian SMS you must register your entity and the OTP template on a DLT portal (Vodafone/Jio/Airtel) — the provider's onboarding guides you. Twilio handles this for you at a higher per-SMS cost.
3. While testing, add **Test phone numbers** (Authentication → Providers → Phone → *Test OTPs*), e.g. `+919876543210` → `123456`, so no SMS is sent.
4. **Authentication → URL Configuration**: set *Site URL* to your Vercel domain.

### C. Email login for professionals
1. **Authentication → Providers → Email** → enabled by default.
2. Recommended for launch: turn **Confirm email** OFF (Authentication → Sign In / Up) so professionals land in their dashboard immediately. Turn it on later once you attach a custom SMTP (Resend / Brevo).

### D. Make yourself admin
After you sign up once at `/pro/signup` (or via Authentication → Users → *Add user*), run in SQL Editor:
```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```
Admins log in at `/pro/login` and use `/admin`.

### E. Deploy on Vercel
1. Push this folder to a GitHub repo → https://vercel.com → **Import project**.
2. Environment variables (copy from `.env.example`):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.in` |
| `NEXT_PUBLIC_SITE_NAME` | `FINI Events` |
| `NEXT_PUBLIC_PLATFORM_WHATSAPP` | your WhatsApp Business number, e.g. `919999999999` |

3. Deploy. Add your custom domain under Vercel → Domains.

### F. Local development
```bash
cp .env.example .env.local   # fill in keys
npm install
npm run dev                  # http://localhost:3000
```

---

## 2. How it works

| Route | Who | What |
|---|---|---|
| `/` | Parents (public) | Event feed – filter by city, child's age, today / weekend / week, category, search |
| `/events/[id]` | Parents | Full details, host card with WhatsApp click-to-chat, one-tap register / waitlist, share on WhatsApp |
| `/login` | Parents | Mobile OTP login |
| `/me` | Parents | Upcoming & past registrations, cancel, rate past events |
| `/pro/signup`, `/pro/login` | Professionals | Email/password account + profile + credential upload |
| `/pro` | Professionals | Dashboard: approval status, events list, cancel/submit/delete |
| `/pro/events/new`, `/pro/events/[id]/edit` | Professionals | Create/edit event (draft → pending → published by admin) |
| `/pro/events/[id]/registrations` | Professionals | Registrant list, attendance marking, per-parent WhatsApp reminder link, CSV export, feedback |
| `/admin` | Admin | Counters; queues of professionals & events awaiting approval |
| `/admin/professionals` | Admin | Approve / reject, view credentials, set badge (Verified / Expert / Parent favourite) |
| `/admin/events` | Admin | Publish / unpublish / cancel / feature |
| `/admin/broadcast` | Admin | Generates the weekly WhatsApp picks message (copy → WhatsApp Business broadcast list) |
| `/admin/cities` | Admin | Switch cities live as you expand |

### Status flows
- Professional: `pending` → `approved` (gets *Verified* badge) / `rejected` (note shown).
- Event: `draft` → `pending` → `published` (admin) → `cancelled`. Editing a published event keeps it published.
- Registration: `registered` / `waitlisted` (capacity full) → `attended` / `no_show` (set by host) or `cancelled` (by parent). Cancelling auto-promotes the first waitlisted parent.

### Security model (Row Level Security in Postgres)
- Parents see only their own registrations; hosts see registrants of their own events; admin sees all.
- Professionals cannot self-approve, self-badge or self-feature.
- Registration is only possible through `register_for_event()` which enforces capacity atomically.
- Credential files live in a private bucket; admin opens them through a 10-minute signed link.
- Child data stored: age band only (DPDP Act 2023, s.9 – data minimisation).

### WhatsApp (Phase 1 – no API)
- Every event page has *Share on WhatsApp* (pre-filled message with link).
- Hosts get a per-parent `wa.me` link with the reminder pre-filled.
- Admin `/admin/broadcast` builds the weekly message; send it from the WhatsApp Business app to a broadcast list of opted-in parents (export numbers: Supabase → Table editor → `profiles` → filter `whatsapp_opt_in = true`).
- Upgrade path: Meta WhatsApp Cloud API for automatic confirmations/reminders (needs business verification + template approval).

---

## 3. Before public launch – checklist
- [ ] Replace `[Name]`/`[email]` placeholders in `/terms` and `/privacy` (grievance officer – IT Rules 2021, Rule 3(2)).
- [ ] Custom domain + Site URL set in Supabase Auth.
- [ ] SMS provider on DLT; test OTP end-to-end on a real number.
- [ ] Create 3 cities' worth of curated professionals before switching those cities live.
- [ ] Add favicon / logo: replace `src/app/favicon.ico`.
- [ ] Set up Supabase daily backups (Project Settings → Database → Backups; free tier keeps 7 days).

## 4. Phase 2 hooks already in the schema
`events.fee` + `registrations` are structured so booking/payment (Razorpay) and commission can be added without migration; `professionals.badge` supports the trust tiers; `feedback` feeds the *Parent favourite* badge.
