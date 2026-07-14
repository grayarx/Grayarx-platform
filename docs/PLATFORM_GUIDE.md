# GrayArx Platform — Complete Step-by-Step Guide

> **Audience:** GrayArx founder (you).  
> **Scope:** Everything from how a lead lands to how you reply, how the pilot works, and how to safely push updates to one dealership without breaking others.

---

## Table of Contents

1. [How the Platform Works — Big Picture](#1-how-the-platform-works--big-picture)
2. [Pilot Outreach — Step by Step](#2-pilot-outreach--step-by-step)
   - Glossary: Dry-run, Segment, Mailable
3. [AI Agents — Who Does What](#3-ai-agents--who-does-what)
4. [Human Interaction — Where It Happens and How to Reply](#4-human-interaction--where-it-happens-and-how-to-reply)
5. [Notification System — How You Get Alerted](#5-notification-system--how-you-get-alerted)
6. [7-Day Pilot Program — How It Runs](#6-7-day-pilot-program--how-it-runs)
7. [Safe Dealership Updates — How to Fix Bugs Without Breaking Anyone](#7-safe-dealership-updates--how-to-fix-bugs-without-breaking-anyone)
8. [Quick Reference — Admin URLs](#8-quick-reference--admin-urls)
9. [Pre-Approvals — The Full Legal and Workflow Picture](#9-pre-approvals--the-full-legal-and-workflow-picture)
10. [Stock Isolation — How Dealerships Are Kept Separate](#10-stock-isolation--how-dealerships-are-kept-separate)

---

## 1. How the Platform Works — Big Picture

GrayArx is a multi-tenant AI sales platform for car dealerships. Here is the full journey from prospect to closed deal:

```
PROSPECT
  │
  ├─ Visits dealership website → AI showroom (Nala chatbot)
  ├─ WhatsApp the dealership → Nala or Lerato handles it
  ├─ After hours → Bongi takes the message and sends a reference reply
  └─ Fills in a pre-approval form → Naledi captures it
          │
          ▼
    AI AGENTS process, qualify, and draft replies
          │
          ▼
    HUMAN DECISIONS (you or the dealer) on:
    • Finance pre-approvals  →  /admin/pre-approvals
    • Test drive bookings    →  /dealer/bookings
    • After-hours follow-up  →  /admin/fallback
    • Agent action queue     →  /admin/approvals
          │
          ▼
    YOU REPLY via WhatsApp directly from those admin screens
          │
          ▼
    DEAL CLOSED or FOLLOWED UP
```

**Key principle:** AI agents handle speed and availability. Humans (you and the dealer) make every final decision that involves money, commitment, or legal risk.

---

## 2. Pilot Outreach — Step by Step

**Where:** `/campaign-dashboard` (admin-only)

### What you see on this screen

| Term | Plain English |
|---|---|
| **Mailable prospects** | Dealerships we researched that have a real, verified email address found on their official website. These are the only ones that will receive emails — hovering the badge confirms this. |
| **Researched** | Total dealerships we looked at for this segment, including those who only have WhatsApp/Facebook (no email to send to). |
| **Segment** | A category of dealership based on their current digital gap. Each segment gets a different email that speaks directly to their pain point. Hover the segment name to see a full explanation. |
| **Dry-run** | Simulates the send without delivering any emails. The system goes through every step — personalisation, deduplication, anti-spam — but returns `resendId: "dry-run"` instead of hitting Resend's API. **Always do a dry-run before a live send.** |
| **Preview** | Opens the actual HTML email for that segment in a popup so you can read it as the prospect will see it. |
| **Send segment** | LIVE. Delivers real emails to all verified addresses in that segment via Resend. Requires confirmation. |
| **Dry-run all segments** | Runs a dry-run across every segment at once. Shows total mailable count and any issues. |

### The 4 segments explained

| Segment | Who they are | Pain point we solve |
|---|---|---|
| **Facebook / WhatsApp only** | Dealers with no website — stock lives on Facebook | GrayArx gives them a full AI showroom instantly without building a website |
| **Basic website — no showroom** | Has a WordPress/listing site but no chat, AI, or after-hours | We add an AI showroom layer on top — no rebuild required |
| **Website closes at 5pm** | Good site but enquiries die after hours | Bongi answers after-hours enquiries 24/7 and sends a reference number |
| **Manual WhatsApp** | Staff answer every WhatsApp message by hand | Lerato automates WhatsApp: qualifies, books test drives, handles FAQs |

### Recommended send sequence

1. Click **"Dry-run all segments"** → confirm the mailable counts look right
2. Click **"Preview"** on each segment → read the email as the prospect will
3. Click **"Dry-run"** on the first segment → check for errors in the toast
4. Click **"Send test"** → send to yourself (`grayarx@gmail.com`) to verify branding in your inbox
5. Click **"Send segment"** for each segment with a confirmation click
6. Done. Resend tracks opens and bounces from the Resend dashboard.

---

## 3. AI Agents — Who Does What

| Agent | Name | When active | What it does | Human needed for |
|---|---|---|---|---|
| **Nala** | Web + WhatsApp chatbot | Always | Answers vehicle questions, qualifies leads, collects contact details | Nothing — but escalates hostile/complex to human |
| **Lerato** | Test drive & booking AI | Always | Accepts test drive requests, finds slots, sends confirmation | Dealer confirms the booking slot manually (`/dealer/bookings`) |
| **Naledi** | Finance pre-approval AI | Always | Captures application form, calculates affordability hint | YOU review and decide approve/decline/more info (`/admin/pre-approvals`) |
| **Bongi** | After-hours fallback | Outside business hours | Sends a professional reply with reference number when no human is available | You follow up the next business morning (`/admin/fallback`) |
| **Mia** | Email outreach AI | On-demand | Drafts follow-up emails to leads | You review drafts before they go out |
| **Kagiso** | Autonomous auditor | Every 24h | Scans the platform for compliance, security, and performance issues | You review high/critical findings (`/admin/kagiso-roadmap`) |

**Rule that never changes:** No AI agent approves finance, confirms a booking, or grants any commitment. Those steps always require a human click.

---

## 4. Human Interaction — Where It Happens and How to Reply

### The four screens where humans must act

#### A. Fallback Inbox (`/admin/fallback`) — After-hours messages
- **What you see:** Every message Bongi handled while you were offline, with the customer's name, contact, original message, and Bongi's auto-reply.
- **What to do:** Read the message. When you're ready to follow up:
  1. Click **"Reply via WhatsApp"** → a dialog opens pre-addressed to the customer's phone number
  2. Type your reply (or edit the suggested message)
  3. Click **"Send WhatsApp"** → message goes from the dealership's WhatsApp number
  4. The item auto-marks as resolved
- **No phone number?** If the customer only used email/web chat, the button won't show — call or email them manually, then click "Mark resolved".
- **Notification you'll receive:** `⚠️ Human reply needed — WhatsApp message (in-hours)` with a link to this page.

#### B. Pre-Approvals Queue (`/admin/pre-approvals`) — Finance applications
- **What you see:** Every finance pre-approval submitted via the public form. Naledi has already calculated an affordability hint.
- **What to do:**
  1. Click **"Review"** on any pending application
  2. Read the full application (income, expenses, vehicle price, deposit, term)
  3. Click **Approve**, **More info**, or **Decline**
  4. Add an internal note if needed
  5. Click **"Record decision"** → immediately after, a **"Send WhatsApp to applicant"** dialog opens with a pre-drafted message based on your decision
  6. Edit the message and click **"Send WhatsApp"** (or click **"Skip"** to skip)
- **Notification you'll receive:** `⚠️ Human decision needed — Finance pre-approval (Dealership Name)` with a link to this page.

#### C. Approval Queue (`/admin/approvals`) — Agent action approvals
- **What you see:** Any agent action that requires your sign-off before it executes (high-value invoices, certain emails, calls).
- **What to do:**
  1. Read the action summary and risk level
  2. Click **"Approve"** to let the agent proceed, or **"Reject"** to discard
  3. If the payload includes a customer contact, a **"Message customer"** button appears — click it to send a freeform WhatsApp message
- **Note:** Items expire after 24 hours automatically.

#### D. Bookings (`/dealer/bookings`) — Test drive confirmations
- **What you see:** Test drive requests Lerato has received. The slot is already suggested based on business hours.
- **What to do:** Confirm or reschedule the slot. Lerato then sends the customer a confirmation.
- **Notification you'll receive:** `⚠️ Human confirmation needed — Test drive (Dealership Name)` with a link.

### How notifications reach you

Every human-interaction event can send a push notification (legacy Manus Forge path if configured; otherwise email). Chat/LLM uses OpenAI only. The notification contains:
- A clear title with `⚠️` prefix so you know it needs action
- The key details (customer name, contact, reference number)
- A URL at the bottom: `→ https://grayarx.com/admin/pre-approvals` (or the relevant page)

**Clicking the URL** takes you directly to the right admin screen where you can reply or decide. No hunting for the right page.

---

## 5. Notification System — How You Get Alerted

GrayArx uses four parallel channels, from most immediate to most reliable:

| Channel | Tool | When it triggers | How to set up |
|---|---|---|---|
| **Push (optional legacy)** | Manus Forge | Human-interaction events if still configured | Storage/notify only — not used for chat LLM |
| **Email alert** | Resend | WhatsApp webhook failures, critical ops | Set `RESEND_API_KEY` + `FOUNDER_ALERT_EMAIL` in `.env` |
| **Transactional email** | Resend | New leads, bookings, trade-ins | Same `RESEND_API_KEY` |
| **WhatsApp to dealer** | Meta Cloud API | New lead arrives for dealer | Configured automatically via `WHATSAPP_ACCESS_TOKEN` |

**Current status of push notifications:** Forge notifications work when `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` are set. If they're not set, the notification silently falls back to email. Check your `.env` file.

---

## 6. 7-Day Pilot Program — How It Runs

**Where to track:** `/admin/pilot-dashboard`

### The 7-day structure

| Day | Milestone | Action |
|---|---|---|
| Day 0 | Dealership onboarded | Invite sent, platform access granted |
| Day 1–2 | Setup phase | Inventory added, WhatsApp number linked, branding configured |
| Day 3–5 | Live phase | Nala active, first real leads expected |
| Day 6 | Review call | Check their metrics: messages, bookings, pre-approvals |
| Day 7 | Decision day | Convert to paid plan or close out |

### What the dashboard shows

Each dealership row now shows:
- A **progress bar** filling over 7 days
- **"Day X of 7 · Y days remaining"** label
- When expired: **"Pilot ended — follow up for conversion"**

### Why 7 days?

7 days is long enough to see real results (at least one test drive booking or lead captured), short enough to maintain urgency. Longer pilots drag out decisions; shorter pilots don't give the tool enough time to prove value. The first 48 hours are setup, so the dealer gets roughly 5 "live" days of data to evaluate.

---

## 7. Safe Dealership Updates — How to Fix Bugs Without Breaking Anyone

### The architecture that makes this safe

Every table in the database has a `dealershipId` column. **All queries filter by dealershipId.** This means:

- A bug fix for Dealership A's inventory display does **nothing** to Dealership B's data
- A schema change (e.g. adding a column) applies to all dealerships simultaneously but is additive — it can't break existing rows
- Agent logic changes affect all dealerships equally — but agents only read/write their own dealership's data

### The safe update process (step by step)

#### Step 1: Identify the scope of the bug

Ask: Is this bug in:
- **Frontend UI only?** (CSS, layout, button label) → Low risk, safe to deploy immediately
- **Business logic?** (agent prompt, calculation, booking flow) → Medium risk, test first
- **Database schema?** (new column, renamed column) → High risk, follow migration process

#### Step 2: Test against a single dealership

1. In your `.env`, confirm `WHATSAPP_DEALERSHIP_ID=1` (your test dealership)
2. Make the fix in code
3. Run `npm run dev` locally
4. Simulate the affected flow using the dealership 1 account
5. Verify the bug is fixed and nothing else broke

#### Step 3: Deploy to production

```bash
# Build
npm run build

# Push DB changes if any (additive only)
npm run db:push

# Restart server (Railway / your host)
# The server hot-reloads all dealerships simultaneously
```

**Zero-downtime:** The platform uses a single Node.js process serving all dealerships. Restarting takes < 5 seconds. Requests during restart get a brief 502 from the load balancer.

#### Step 4: Verify each dealership still works

After deploy, spot-check each active dealership:
1. Open their `/dealer/dashboard`
2. Confirm leads load, inventory loads, agents respond
3. If any dealership shows an error, roll back (see below)

#### Step 5 (if needed): Roll back

```bash
# Revert to the previous git commit
git revert HEAD --no-edit
git push origin main

# Redeploy
npm run build && npm run start
```

### Schema changes — the safe rule

**Never rename or delete a column in production without a migration plan.**

Safe schema changes:
```sql
-- Adding a nullable column — always safe
ALTER TABLE dealerships ADD COLUMN pilotExpiresAt DATETIME NULL;

-- Adding an index — safe
CREATE INDEX idx_dealership_status ON dealerships(status);
```

Risky schema changes (need a migration):
```sql
-- Renaming a column — breaks all queries using the old name
-- Solution: Add the new column, migrate data, then drop the old one in a follow-up deploy

-- Changing a column type — can corrupt data
-- Solution: Test on a copy of the database first
```

### Module-level isolation (per-dealership feature flags)

Each dealership has a `modulesEnabled` JSON field. This lets you:

1. **Disable a broken module for one dealership** without touching others:
   - Go to `/admin/dealerships`
   - Click the dealership
   - Toggle off the affected module (e.g. "WhatsApp automation")
   - The agent stops processing for that dealership immediately
   - Fix the bug
   - Toggle the module back on

2. **Roll out a new feature to one dealership first:**
   - Enable the module only for dealership 1 (your test)
   - Verify it works
   - Enable for remaining dealerships one by one

### The 12 modules that can be toggled per-dealership

| Module ID | What it controls |
|---|---|
| `whatsapp_automation` | Nala/Lerato on WhatsApp |
| `booking_engine` | Test drive booking flow |
| `pre_approval` | Naledi finance form |
| `trade_in` | Trade-in valuation flow |
| `after_hours` | Bongi fallback agent |
| `inventory_ai` | AI-powered inventory recommendations |
| `email_campaigns` | Mia outreach emails |
| `analytics` | Dashboard analytics |
| `compliance_audit` | Kagiso autonomous auditing |
| `sms_notifications` | SMS via Twilio |
| `market_guide` | Vehicle market pricing guide |
| `dealer_network` | Multi-dealership network features |

---

## 8. Quick Reference — Admin URLs

| URL | What it is |
|---|---|
| `/admin/overview` | Platform-wide metrics |
| `/admin/approvals` | Agent action approval queue (**human required**) |
| `/admin/pre-approvals` | Finance applications (**human required**) |
| `/admin/fallback` | After-hours messages to follow up (**human required**) |
| `/admin/pilot-dashboard` | 7-day pilot tracking per dealership |
| `/admin/kagiso-roadmap` | Autonomous audit findings |
| `/admin/dealerships` | All dealerships, module toggles, settings |
| `/admin/agents` | Agent configurations and prompts |
| `/admin/compliance` | Compliance status |
| `/campaign-dashboard` | Pilot outreach email campaigns (dry-run + send) |
| `/dealer/bookings` | Test drive bookings (**human confirmation**) |
| `/dealer/leads` | Lead inbox |
| `/dealer/whatsapp` | WhatsApp conversation history |
| `/api/webhooks/health` | Webhook config health check (live) |

---

## 9. Pre-Approvals — The Full Legal and Workflow Picture

### The short answer to your questions

| Question | Answer |
|---|---|
| Do customers send us bank statements + payslips? | **No.** GrayArx collects financial details only (income, expenses). Physical documents go directly to the dealer. |
| Is it legal for GrayArx to do pre-approvals? | **Yes — as a pre-qualification tool only.** GrayArx is not a registered credit provider and cannot make credit decisions. |
| Who sees the bank statements? | The **dealer's F&I manager** and the bank (WesBank / Absa / Nedbank). Never GrayArx. |
| Where does everything live in the system? | Pre-approval details live under the client in `/admin/pre-approvals`. The dealer tracks document receipt in their own notes field. |

---

### Why GrayArx does NOT collect physical documents

**Legal reason:** Under the **National Credit Act (NCA) 34 of 2005**, only registered credit providers (banks and registered entities) may conduct a formal credit assessment. GrayArx is not registered as a credit provider. That means:

- GrayArx **can**: Collect affordability details, calculate an affordability hint, pre-qualify a customer, and pass the pre-qualification to the dealer's F&I department. ✓
- GrayArx **cannot**: Make a credit decision, approve or decline credit, or act as a credit bureau. ✗

**POPIA reason:** Storing payslips and 3-month bank statements on GrayArx's servers would mean GrayArx is holding highly sensitive financial data for thousands of customers across multiple dealerships. Under POPIA, GrayArx would then be responsible for:
- Data retention limits (how long can you keep a payslip?)
- Breach notifications (if hacked, GrayArx would owe every customer in SA a notification)
- Data deletion on request (far more complex with uploaded files)
- Secure storage audits

Keeping GrayArx as a **pre-qualification platform only** (no raw documents) is cleaner, safer, and legally correct. The dealer and the bank carry the document liability — which is exactly how the industry already works.

---

### The two-stage pre-approval workflow

```
STAGE 1 — GrayArx (Pre-qualification)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Customer fills in Naledi's 4-step form on the dealership showroom:
  Step 1: Name, email, phone, SA ID (masked to last 4 digits)
  Step 2: Employment status, employer, months in role
  Step 3: Gross income, net income, monthly expenses, existing debt
  Step 4: Vehicle price, deposit, term + POPIA consent

GrayArx system automatically:
  → Calculates an affordability hint (flag: "can_afford" / "tight" / "over_stretched")
  → Stores the application with a reference number (e.g. REF-2026-0042)
  → Sends you a push notification: ⚠️ Human decision needed — Pre-approval
  → Links you directly to /admin/pre-approvals

You (or the dealer) reviews and clicks:
  → APPROVE TO PROCEED  (customer can afford it — call them in for documents)
  → MORE INFO NEEDED    (missing something — send a WhatsApp asking for clarification)
  → DECLINE             (unaffordable — send a polite WhatsApp explaining)

A pre-drafted WhatsApp message opens automatically. You edit and send.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STAGE 2 — Dealer F&I (Formal Credit Application)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Only triggered when dealer marks "Approved to proceed"

The dealer's F&I manager contacts the customer DIRECTLY (call or WhatsApp)
and requests the formal document pack:

  ✓ 3 months payslips (or 6 months business bank statements if self-employed)
  ✓ 3 months bank statements
  ✓ Copy of SA ID / passport
  ✓ Proof of residence (not older than 3 months)
  ✓ Proof of current vehicle finance (if trade-in)

These documents go DIRECTLY to the dealer — by WhatsApp, email, or hand-delivered.
The F&I manager then submits a formal credit application through:
  → WesBank / MFC / Absa Vehicle Finance / Nedbank Vehicle Finance portal
  → The BANK makes the final credit decision (not GrayArx, not the dealer)

GrayArx tracks the outcome by letting the dealer update the status:
  → "Documents received" → "Submitted to bank" → "Bank approved / declined"
```

---

### What each role sees in the system

| Role | What they see |
|---|---|
| **Customer** | The 4-step Naledi form → reference number → confirmation message. Nothing else. They never log in to GrayArx. |
| **Dealer / F&I manager** | Pre-approval details in their dealer dashboard: name, contact, affordability hint, reference. NOT the income figures (POPIA — only the dealer who received consent can see financial detail). |
| **GrayArx founder (you)** | Everything in `/admin/pre-approvals` — full affordability data, all dealerships' applications. This is the admin oversight role. |

---

### What the POPIA consent on the form covers

The consent checkbox on Naledi's form says:

> *"I consent (POPIA) to the dealership's finance team receiving and reviewing the information above for the purpose of assessing this pre-approval request. I understand no automated decision is made by this form."*

This covers:
- Sharing the customer's income + employment details with **that specific dealer's** finance team
- Storing the application with the reference number
- The dealer contacting the customer about the application

It does **not** cover:
- Sharing the application with other dealerships
- Using the data for marketing
- Storing physical documents on GrayArx's servers

---

### Where does the pre-approval live relative to leads?

The pre-approval is a **separate entity** from a lead, but they're linked:

- A **lead** is created when someone enquires about a vehicle (WhatsApp message, chatbot, contact form).
- A **pre-approval** is created when someone specifically applies for finance.
- A customer can be both: they enquire via WhatsApp (creates a lead) AND submit a pre-approval form (creates a pre-approval).

The two are linked by phone number / email. Future: clicking a pre-approval in the admin view will show a "View linked lead" button. For now, search by phone number in `/dealer/leads` to find the customer's conversation history alongside their pre-approval.

---

### Should we add document upload to the form later?

Only if and when GrayArx becomes a registered entity or partners with a licensed credit provider (like a bank). At that point:
- Documents would need to be stored in an encrypted S3 bucket with a 90-day auto-delete
- A separate POPIA data processing agreement with the customer would be needed
- The upload would only be visible to the specific dealer and the bank, never to other dealerships

For the pilot, the current design is correct and legally clean.

---

## 10. Stock Isolation — How Dealerships Are Kept Separate

### The rule

**Every dealership can only ever see, edit, or delete their own stock.** This is enforced at every layer:

| Layer | Isolation mechanism |
|---|---|
| Database schema | `vehicles.dealershipId` — every vehicle row carries the dealership it belongs to |
| `listVehicles()` DB helper | Accepts `{ dealershipId }` and filters all queries — no filter = founder-only admin view |
| `dealer.listVehicles` tRPC | Filters by `ctx.user.dealershipId` automatically; founder/admin gets all (admin pages only) |
| `dealer.updateVehicle` | Checks `vehicle.dealershipId === caller.dealershipId` before mutating; throws FORBIDDEN if mismatch |
| `dealer.deleteVehicle` | Same ownership check before deletion |
| `showroom.list` public API | Requires `dealershipId` input — returns `[]` if none supplied; no cross-tenant bleed |
| Home page (`/`) | Never fetches live inventory — uses static editorial imagery only |
| CSV / photo import | Stamps `dealershipId: ctx.user.dealershipId` on every created row |

### What the founder sees vs. what a dealer sees

| Screen | Founder (you, admin role) | Dealer user |
|---|---|---|
| `/dealer/inventory` | All stock across all dealerships | Only their own dealership's stock |
| `/admin/*` pages | All stock, all dealerships | Cannot access admin pages |
| `/showroom` | Scoped to the "primary" active dealership | Scoped to their own dealership |
| Home page `/` | Static imagery, no real stock | Same |

### Running the migration after this update

The `vehicles` table needs the new `dealershipId` column added. Run this once after deploying:

```bash
cd grayarx-v2-ui/grayarx-platform
npm run db:push
```

Drizzle Kit generates the `ALTER TABLE vehicles ADD COLUMN dealershipId int NULL;` migration and applies it. Existing vehicle rows get `NULL` for `dealershipId` — they remain visible to the founder in admin views but are invisible to any dealer user (since no dealer's ID matches NULL). Upload fresh stock via CSV or manually to re-attach it to the correct dealership.

---

*Last updated: July 2026 · GrayArx internal documentation*
