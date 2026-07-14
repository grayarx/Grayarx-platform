# GrayArx Dealer Q&A Playbook

**Audience:** Founder / sales on dealer calls  
**Tone:** South African dealer — confident, plain, no hype  
**Version:** July 2026 · v2 (replaces the first July draft)  
**Rule:** Answers ≤ 2–3 sentences. Lead with the win. One-line **Note:** for caveats. Separate **Say this** vs **Never say**.

**Verified product status (git `main` @ `dd3d669`, Jul 2026):**
- Shipped: custom assistant name, STOP opt-out, DB inventory search, `/embed/:shortcode`, branded invoices + FNB EFT env, auto WhatsApp `phone_number_id` link, shortcodes, 24/7 Nala (web + WhatsApp).
- Multi-branch (`groupKey` + Branch switcher): **shipped on `main` (`239af44`).** Includes groupKey, Branch switcher, Admin create group, `/admin/groups/:groupKey`. Migration `0069` must run on Railway deploy before production go-live for a dealer group.

---

## 1. Elevator (30 seconds)

**Say this**

GrayArx gives your yard a 24/7 AI assistant on WhatsApp and webchat that answers stock questions from your live inventory, books viewings, and hands warm leads to your team. Buyers get your branded showroom and embed; you get a shortcode, auto-linked WhatsApp, and invoices with FNB EFT details. Multi-branch yards use one group key and a branch switcher so each site keeps its own stock and number.

**If they ask nothing else, say this**

We put an AI sales floor on WhatsApp and your website that never closes — priced for SA independents, not enterprise CRM theatre.

---

## 2. Top 15 questions dealers WILL ask

### Q1. “What exactly do we get?”

**Say this:** A public showroom, WhatsApp + webchat AI (default name Nala — you can rename it), live stock answers, booking links, lead inbox, and a drop-in embed for your site. Shortcode powers `/book`, `/apply`, and `/embed/{shortcode}`.

**Note:** Pilot partners get Growth-level features; public price list stays soft until post-pilot.

---

### Q2. “Does it work after hours?”

**Say this:** Yes — Nala replies 24/7 on WhatsApp and webchat so weekend and late-night buyers still get stock answers and next steps. Your team wakes up to leads and bookings, not a dead inbox.

**Note:** Complex finance/trade-ins escalate to humans; AI does not close credit deals alone.

---

### Q3. “Will it sell the wrong car / invent stock?”

**Say this:** Stock answers are searched against your dealership’s database — make, model, body type, colour, budget — scoped to your yard only. If it is not in inventory, we say so and offer alternatives or a booking.

**Note:** Keep CSV/photos current; garbage in, weak answers out.

---

### Q4. “Can we call the bot something else — not Nala?”

**Say this:** Yes. In dealer Settings you set a custom assistant name (up to 40 characters). Greetings, WhatsApp disclosure, and opt-out copy use that name.

**Note:** Default remains Nala if left blank.

---

### Q5. “What about POPIA / people saying STOP?”

**Say this:** Buyers can reply STOP (or unsubscribe / opt-out) and we stop proactive automated follow-ups. Reply START turns help back on. First chats acknowledge POPIA processing for the enquiry.

**Note:** You still own dealer-side consent for outbound marketing you send yourselves.

---

### Q6. “Do we need Meta / WhatsApp Business?”

**Say this:** No Cloud API chatbot without a WhatsApp Business number on Meta. If they have no WA Business number yet: they can still use webchat + public showroom + wa.me click-to-human. Path: get WhatsApp Business → we link `phone_number_id` → AI on. We auto-link when the display number matches onboarding or an unbound dealership.

**Note:** Number must be verified and webhooks subscribed; until then webchat + showroom still work. Dealer Settings shows a WhatsApp AI setup checklist (linked / not linked).

---

### Q7. “How long to go live?”

**Say this:** Most yards: provision + shortcode same day; stock CSV + photos in a few hours; WhatsApp live once Meta verify + webhook subscribe are done. Target: useful in 48 hours.

**Note:** Meta verification can delay WhatsApp; do not promise a same-day WA go-live if their Business Manager is messy.

---

### Q8. “What does it cost?”

**Say this:** Pilot is Growth-level features at a founder-friendly monthly rate discussed on the call — not a per-user CRM tax. List tiers after pilot: Showroom / Growth / Multi-site (future Group SKU above that).

**Note:** Do not invent a public ZAR figure if the pricing page is still soft; confirm current pilot floor with founder before the call.

---

### Q9. “We already have Cars.co.za / Facebook ads.”

**Say this:** Keep them. GrayArx is the always-on reply layer for people who already messaged or landed on your showroom — not a replacement for classifieds or an ad-buy agency.

**Note:** “We convert inbound attention; we are not an ad-buy agency” is **not bad** — it sets scope and avoids competing with their media buyer. Softer alternative if they prefer: “We make sure the buyers your ads already send you get a fast, accurate answer — we don’t buy the clicks.”

---

### Q10. “Will it replace my salespeople?”

**Say this:** No — it answers the 11pm “is the Hilux still available?” so your floor spends time on test drives and closes. Humans stay on negotiation, trade-in, and finance.

**Note:** Never pitch “fire half the floor.”

---

### Q11. “Can it go on our own website?”

**Say this:** Yes — open Dealer → Settings → Website embed. Copy-paste the iframe or script snippet (one click). Your shortcode is already generated; same code drives book and apply URLs.

**Note:** WordPress needs a one-line shortcode plugin only if they want `[grayarx_book code="…"]`; plain iframe/script needs no plugin.

---

### Q12. “We have three branches.”

**Say this:** Each branch is its own dealership record — own stock, WhatsApp, shortcode — linked by the same `groupKey`. Staff with sibling branches get a Branch switcher in the console. Founder ops: Admin → Dealerships → 5-click checklist (create group → assign key → WA id + shortcode → smoke-test switcher).

**Note:** Shipped on `main`. Confirm migration `0069` has run on Railway before promising a go-live date for that dealer group.

**Tier packaging (SA):** Recommend **Showroom → Growth → Multi-site → Group**. Today’s DB enum is still three IDs (`starter` / `professional` / `enterprise`); display names are Showroom / Growth / **Multi-site**. A fourth **Group** SKU (holding-company packaging above Multi-site) needs a clean enum migration later — do not promise a separate Group plan until that ships.

---

### Q13. “What languages?”

**Say this:** Built for SA — English, Afrikaans, isiZulu, isiXhosa, and the other official languages, plus Portuguese for diaspora buyers. The assistant matches the buyer’s language where detection is clear.

**Note:** Quality is strongest in EN/AF; rare languages may be shorter / more careful.

---

### Q14. “What if the AI is wrong or Meta is down?”

**Say this:** Failed or low-confidence paths land in your fallback / human queue with a reference — not silent failure. Template replies still work if the LLM is briefly offline.

**Note:** Meta outages are Meta’s; we monitor webhook health and dead-letter alerts on our side.

---

### Q15. “How do invoices / payment work?”

**Say this:** Platform invoices are GrayArx-branded PDFs. Subscription invoices can include FNB EFT pay-to details from secure server env — no account numbers in chat or git.

**Note:** Card/Stripe is optional; EFT works without it.

---

## 3. Deep dive appendix (by theme)

### Stock & inventory

| Topic | Say this | Note |
|-------|----------|------|
| Source of truth | Answers search your DB for that dealership — not a generic car brochure. | Sold units should be marked sold so they drop out. |
| CSV import | Import CSV; we heal shortcodes and warn on bad rows rather than silently skipping stock. | R1 placeholders need a quick price fix before go-live. |
| Photos | Showroom credibility = photos + price + km. | Weak photos = weak WhatsApp trust. |
| Scale (5 000 cars) | Architecture is per-dealership DB search with limits — fine for large yards with fair-use caps on chat volume. | Multi-site / future Group tier + fair-use for mega fleets; don’t promise free unlimited AI on 5k active chats. |

### Meta / WhatsApp

| Topic | Say this | Note |
|-------|----------|------|
| Setup | Verified WA Business number + webhook subscribe + token. | Founder ops guide: production HTTPS webhook on grayarx.com. |
| Auto-link | Matching display phone can bind `phone_number_id` automatically. | Ambiguous matches (two unbound dealers, same number) stay manual. |
| Disclosure | Assistant identifies as AI; custom name shows in disclosure. | Required for trust + POPIA posture. |

### POPIA & trust

| Topic | Say this | Note |
|-------|----------|------|
| STOP | Honoured for automated follow-ups; START resumes. | Dealer still needs lawful basis for their own campaigns. |
| Data | Enquiry messages processed to help that enquiry. | Point them at legal hub / POPIA consent form for signatures. |
| Masking | Customer-facing invoice PDFs mask sensitive digits (last-4 style). | Never paste full bank or ID numbers into WhatsApp demos. |

### Pricing (talk track)

| Topic | Say this | Note |
|-------|----------|------|
| Pilot | Growth features, founder rate, limited seats. | Soft public pricing page during pilot. |
| Value frame | All-in showroom + AI + leads vs per-seat CRM. | Compare to “CRM + unanswered WhatsApp,” not to Cars.co.za listing fees. |
| Overage | Heavy WhatsApp/AI use can attract overage later — protects both sides. | Year 1: avoid per-car-sold commission talk. |

### After-hours

| Topic | Say this | Note |
|-------|----------|------|
| 24/7 | Nala answers stock and captures intent overnight. | Bookings still respect your business hours where configured. |
| Handoff | Morning list: leads, bookings, anything needing a human. | Train staff to open the dealer console daily. |

### Languages

| Topic | Say this | Note |
|-------|----------|------|
| Coverage | 11 SA official languages + Portuguese. | EN/AF first-class; others supported carefully. |
| Tone | SA English spelling and dealer-floor politeness. | No US slang in demos. |

### Integrations

| Topic | Say this | Note |
|-------|----------|------|
| Website | Embed + book/apply shortcode URLs. | Works beside existing site — no full rebuild. |
| Email | Transactional lead/booking mail via Resend. | SMS (Twilio) optional later. |
| Billing | Branded invoice PDF + FNB EFT env; Stripe optional. | Never commit live account numbers. |

### Scale & failures

| Topic | Say this | Note |
|-------|----------|------|
| Multi-yard | One group key, many dealership rows, Branch switcher. | After migrate `0069` on Railway: wire groupKey; until then separate accounts. |
| LLM down | Templates + disclosure still reply; polish resumes when quota is up. | Don’t demo “perfect prose” as a hard dependency. |
| Wrong answer | Correct the stock row; AI follows the DB next time. | Human override always available. |

---

## 4. Tier cheat-sheet — what “AI 24/7” means

| | **Showroom** (starter) | **Growth** (professional) | **Multi-site** (enterprise) |
|--|------------------------|---------------------------|------------------------------|
| **Internal id** | `starter` | `professional` | `enterprise` |
| **AI 24/7 means** | Webchat / showroom assistant answering stock & bookings around the clock within plan caps | Same + WhatsApp volume for a busy independent | Same + multi-branch / high volume + stronger model tier |
| **Channels** | Web-first | Web + WhatsApp | Web + WhatsApp (multi-branch) |
| **LLM tier** | Efficient model | Stronger (Growth) | Premium model |
| **Stock ballpark** | ~150 vehicles included | ~500 | Fair-use unlimited\* |
| **Pilot today** | - | **This is what pilots get** | Multi-branch after migrate `0069`; future **Group** SKU (4th tier) deferred |

**Recommended packaging (when enum can grow):** Showroom → Growth → Multi-site → **Group** (holding / multi-brand last).

\*Contract fair-use — say “large yards welcome; we set sensible AI caps.”

**One-liner for “AI 24/7”:** The assistant is available every hour buyers message — not that a human salesperson is online at 03:00.

---

## 5. Multi-branch pitch (shipped on main)

**Status:** Shipped on `main` (`239af44`): `groupKey`, Branch switcher, Admin create group, `/admin/groups/:groupKey`, migration `0069_dealer_groups`. **Migration `0069` must run on Railway deploy** before a dealer group is live in production.

### Pitch (Say this)

Each branch keeps its own stock, WhatsApp number, and shortcode. We link them with one `groupKey` so managers switch branches in the console without juggling logins. You still report and bill per branch cleanly.

### Ops steps (founder / admin) — also on Admin → Dealerships help card

1. **Create group** — slug in Admin → Dealerships → Create group.  
2. **Create / open each branch** — one dealership row per yard.  
3. **Assign the same `groupKey`** on each branch (Group key dialog).  
4. **WhatsApp + shortcode** — each branch’s Meta `phone_number_id` + confirm `publicShortcode`.  
5. **Smoke-test** — dealer login → Branch switcher → inventory/leads change.  
6. Import stock **per branch** (never mix yards in one CSV).  
7. Only then tell the dealer “multi-branch is live on your account.”

APIs: `adminDealerships.createGroup`, `adminDealerships.setGroupKey`, `dealer.listBranches` / `switchBranch`. Migration `0069` is in `scripts/apply-pending-migrations.mjs`.

**Note:** Do not say "already live for everyone on grayarx.com" — code is on `main`; each group goes live only after migrate `0069` and ops setup below.

---

## 6. Never-say list (updated)

**Never say**

- “It replaces your sales team / you can fire people.”  
- “100% accurate every time” / “never hallucinates.”  
- “Live on Meta tonight” when their number is unverified or webhooks off.  
- "Multi-branch is in production for all dealers" (on `main` at `239af44`, but each group needs migrate `0069` + ops setup).  
- Exact public ZAR prices if the pricing page is still pilot-soft — unless founder confirmed today’s number.  
- “We store / paste your FNB account in WhatsApp” — EFT details come from secure env on invoices only.  
- “Unlimited free AI on 5 000 cars with unlimited chats.”  
- “POPIA is fully handled — you don’t need consent forms.”  
- “Twilio SMS is included and live” (optional / later).  
- “OpenAI / LLM is required for any reply” — templates cover outages.  
- Competitor-bashing by name; US SaaS buzzwords (“synergy,” “disrupt,” “agentic swarm”).  
- Promises about credit approval, guaranteed sales, or RMI/manufacturer compliance seals we don’t have.

**Prefer instead**

- “Answers from your live stock; humans close the deal.”  
- “24/7 assistant — your team still owns negotiation and finance.”  
- “WhatsApp once Meta verify + subscribe are done; webchat can start today.”  
- “Branches = separate yards, one group key, switcher when we flip it on for you.”

---

## Quick reference — product truths (July 2026)

| Truth | Dealer-facing line |
|-------|--------------------|
| Custom name | “Name the assistant whatever fits your brand.” |
| STOP | “Buyers reply STOP — automated follow-ups stop.” |
| DB search | “It looks up *your* cars, not a random catalogue.” |
| Embed | “One shortcode → embed, book, apply.” |
| Invoices | “Branded PDF; FNB EFT on platform invoices from secure settings.” |
| WhatsApp auto-link | “We match your Business number to Meta’s id when we can.” |
| Shortcodes | “Your public ID for showroom and links.” |
| 24/7 Nala | “WhatsApp + webchat, day and night.” |
| Multi-branch | "Shipped on main (`239af44`): groupKey, Branch switcher, Admin create group, `/admin/groups/:groupKey` — migrate `0069` on Railway first." |

---

*End of playbook. Keep answers short. Win first. One Note. Never invent production status.*
