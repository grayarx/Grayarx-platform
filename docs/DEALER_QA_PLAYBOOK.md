# GrayArx Dealer Q&A Playbook

**Audience:** Founder / sales on dealer calls  
**Tone:** South African dealer — confident, plain, no hype  
**Version:** July 2026 · v3  
**Rule:** Answers ≤ 2–3 sentences spoken. Lead with the win. One-line **Note:** for caveats. Use **Written (SMS/WhatsApp)** only when a short paste helps.

**Product truths (July 2026 — ship what we have):**
- Tiers: **Showroom / Growth / Multi-site** (DB ids `starter` / `professional` / `enterprise`). No separate “Group” SKU yet — don’t invent one.
- Pilot: Growth features @ negotiated rate; public list prices hidden (`PILOT_PRICING_HIDDEN`). Missing Meta WA Business does **not** auto-downgrade to Showroom — Cloud API WhatsApp is just blocked until linked.
- Nala 24/7 AI for Q&A, bookings, leads; humans optional for handoff. Showroom = web chat + click-to-chat; Growth+ = WhatsApp Cloud API bot (needs Meta WA Business number).
- Chat LLM: **OpenAI → templates**. No Manus Forge for chat.
- VIN: optional; if entered must be valid ISO 3779 (17 chars + check digit); masked publicly.
- Multi-branch: one dealership row per branch + shared `groupKey` + Branch switcher (Multi-site).
- Pilot stock: **CSV import** — not live Cars.co.za sync yet. Sold preserved on re-import; R1 placeholders excluded from public showroom until fixed.
- POPIA, STOP/START WhatsApp, usage caps per tier.
- Billing: Stripe and/or bank EFT (FNB) when configured; soft public pricing. Contract: month-to-month or 12-month commit (founder rate lock).
- Photo mirroring: optional (keep external URLs or mirror into GrayArx storage).
- Agents improve via outcomes + dealer FAQs — **not** “we train on your customers.” Bug reports → Kagiso investigates → founder approves.
- Pilot SLA: `docs/PILOT_SLA.md` (honest founder-led response times).

---

## 1. Elevator (30 seconds)

**Say this**

GrayArx gives your yard a 24/7 AI assistant — Nala by default — on webchat and, on Growth+, WhatsApp. She answers from your live inventory, books viewings, and drops warm leads in your inbox. Buyers get a branded showroom and embed; you get CSV stock, shortcodes, and invoices you can pay by card or EFT.

**If they ask nothing else**

We put an AI sales floor on WhatsApp and your website that never closes — priced for SA independents, not enterprise CRM theatre.

---

## 2. Questions dealers WILL ask (by theme)

### Price & billing

#### Q1. “What does it cost?”

**Say this:** Pilot partners get Growth-level features at a founder-friendly monthly rate we agree on the call — not a per-seat CRM tax. Public site keeps list prices soft until post-pilot. Packaged tiers after that: Showroom, Growth, Multi-site.

**Written:** Pilot = Growth features @ negotiated monthly. Public prices stay soft. Tiers: Showroom → Growth → Multi-site.

**Note:** Do not invent a public ZAR figure unless founder confirmed today’s floor. Internal reference only (not on site): pilot often anchored near Showroom list while unlocking Growth.

---

#### Q2. “What’s in Showroom vs Growth vs Multi-site?”

**Say this:** Showroom = public showroom, inventory/CSV, leads, bookings, webchat Nala, click-to-chat WhatsApp. Growth adds Cloud API WhatsApp bot, higher AI/message caps, deal-score, photo angles. Multi-site = Growth plus multi-branch (`groupKey` + Branch switcher), highest caps, dedicated onboarding.

**Note:** Internal ids are still starter / professional / enterprise — always say the display names to dealers.

---

#### Q3. “How do we pay — card or EFT?”

**Say this:** Both when set up: Stripe for card, or GrayArx-branded invoices with FNB EFT pay-to details from secure settings. You choose what fits the yard.

**Note:** Never paste full bank details into WhatsApp demos; invoices mask sensitive digits.

---

#### Q4. “What happens if we go over the message / AI cap?”

**Say this:** Each tier has fair-use caps (AI sessions and WhatsApp volume). We soft-block with a clear message so a runaway bot doesn’t blow the bill; we talk overage if you’re consistently hot.

**Note (caps — say ballpark, not spreadsheet):** Showroom ~400 AI/mo, click-to-chat only; Growth ~1,200 AI + ~2,000 WA msgs; Multi-site ~3,500 AI + ~8,000 WA.

---

### WhatsApp & Meta

#### Q5. “Do we need a WhatsApp Business number / Meta?”

**Say this:** For the Cloud API bot: yes — a verified WhatsApp Business number on Meta, webhooks subscribed, then we link `phone_number_id`. Pilot partners still get **Growth features** (showroom, inventory, leads, webchat Nala, caps) at the pilot price even before Meta is done — you’re not dropped to Showroom. Without WA Business you just can’t run Cloud API Nala on WhatsApp yet; webchat + wa.me click-to-chat still work.

**Written:** Pilot = Growth features @ pilot price. Cloud API WhatsApp needs Meta WA Business. No Meta yet → still Growth web/showroom/leads/webchat; only the WhatsApp bot waits.

**Note:** Settings shows WhatsApp AI checklist (linked / not linked). Auto-link **works** when Meta’s display number matches exactly one unbound dealership’s `contactPhone` (or pending onboarding owner phone) — then webhooks write `phone_number_id`. Manual Admin paste still fine if phones don’t match.

---

#### Q6. “Do I need a new number?”

**Say this:** Prefer your existing WhatsApp Business number if Meta will verify it for Cloud API — buyers keep messaging the number they know. Only get a new number if the current one can’t be moved to Business / Cloud API cleanly.

**Note:** Never promise “same personal phone tomorrow” if Business Manager is a mess — Meta timing is theirs.

---

#### Q7. “How long until WhatsApp is live?”

**Say this:** Provision + shortcode + CSV can be same day; WhatsApp AI goes live once Meta verify + webhook subscribe are done. Target useful yard in ~48 hours; WA may slip if Meta queues you.

**Note:** Don’t promise same-day WA if their Business Manager isn’t ready.

---

### AI (Nala)

#### Q8. “What exactly do we get?”

**Say this:** A public showroom, AI on webchat (all tiers) and WhatsApp Cloud API on Growth+, live stock answers from your DB, booking links, lead inbox, website embed. Default assistant name Nala — rename in Settings. Shortcode powers `/book`, `/apply`, `/embed/{shortcode}`.

**Note:** Humans are optional for handoff — not required for every reply.

---

#### Q9. “Does it work after hours?”

**Say this:** Yes — Nala answers 24/7 on the channels you have live, so late-night and weekend buyers still get stock answers and next steps. Your team wakes up to leads and bookings.

**Note:** Complex finance / trade-ins escalate to humans; AI does not approve credit.

---

#### Q10. “Will it replace my salespeople?”

**Say this:** No — it answers the 11pm “is the Hilux still available?” so your floor spends time on test drives and closes. Humans own negotiation, trade-in, and finance.

**Note:** Never pitch “fire half the floor.”

---

#### Q11. “What if the AI is wrong?”

**Say this:** Stock answers are searched against your dealership’s inventory — if it’s not in the DB, we say so. Low-confidence or failed paths land in your fallback / human queue with a reference. Fix the stock row; the next answer follows the DB. Templates still reply if the LLM is briefly offline.

**Written:** Answers from your stock DB. Wrong listing → fix inventory. Fallback queue if unsure. Templates cover LLM outages.

**Note:** OpenAI polishes when quota is up; otherwise deterministic templates. No Manus Forge for chat.

---

#### Q12. “Do you train on our customers / our chats?”

**Say this:** No — we don’t sell a story that we “train on your customers.” The assistant gets sharper from deal outcomes you mark, FAQs you add, and keeping inventory accurate — not from harvesting buyer chats into a public model.

**Note:** Point to privacy / POPIA docs if they want it in writing.

---

#### Q13. “Can we rename Nala?”

**Say this:** Yes — Settings → custom assistant name (up to 40 characters). Greetings, WhatsApp disclosure, and opt-out copy use that name.

**Note:** Blank = Nala.

---

#### Q14. “What languages?”

**Say this:** Built for SA — English, Afrikaans, isiZulu, isiXhosa, and the other official languages, plus Portuguese for diaspora buyers. Matches the buyer’s language when detection is clear.

**Note:** Strongest in EN/AF; rarer languages may be shorter / more careful.

---

### Inventory & VIN

#### Q15. “How does stock get in — Cars.co.za sync?”

**Say this:** Pilot path is honest: CSV import (and manual edits) into your GrayArx inventory. That DB is what Nala and the showroom use. Live Cars.co.za sync is not the pilot promise — we can map their CSV exports; we don’t claim a always-on classifieds scrape as the product.

**Written:** Pilot = CSV (or manual) into GrayArx. Not live Cars.co.za sync yet. Nala answers from your GrayArx stock.

**Note:** Keep sold units marked sold — CSV re-import will not resurrect sold stock as available. R1/placeholder prices are hidden from the public showroom and chat until fixed (Inventory or Settings → Fix R1 prices). Demo heal only touches demo-yard metadata — never writes R1 onto real dealers.

---

#### Q16. “What about VIN?”

**Say this:** VIN is optional. If you enter one, it must be a valid ISO 3779 VIN — 17 characters, correct check digit (no I, O, Q). Public showroom and customer-facing docs mask it; staff see what they need in the dealer console.

**Note:** Invalid VIN on CSV import soft-warns — fix in Inventory rather than inventing stock.

---

#### Q17. “Photos — do you host them?”

**Say this:** You can keep photos on external URLs from the CSV, or optionally mirror them into GrayArx storage for durability. Mirroring is optional — not forced — so light yards aren’t paying for storage they don’t need.

**Note:** Weak photos = weak WhatsApp trust; showroom credibility = photos + price + km.

---

### Multi-branch

#### Q18. “We have three branches.”

**Say this:** Each branch is its own dealership record — own stock, WhatsApp, shortcode — linked by one `groupKey`. Staff with sibling branches get a Branch switcher in the console. That’s the Multi-site packaging.

**Note:** Confirm migration / ops: create group → assign `groupKey` → WA id + shortcode per branch → smoke-test switcher. Import stock per branch — never mix yards in one CSV.

---

### POPIA & trust

#### Q19. “What about POPIA / people saying STOP?”

**Say this:** Buyers can reply STOP (or unsubscribe / opt-out) and we stop proactive automated follow-ups. Reply START turns help back on. First chats acknowledge POPIA processing for the enquiry.

**Written:** STOP = stop automated follow-ups. START = resume. Enquiry processing disclosed up front.

**Note:** Dealer still owns lawful basis for their own outbound marketing campaigns.

---

#### Q20. “Who owns the leads?”

**Say this:** You do. Leads and bookings sit in your dealership account for your team to work. GrayArx is the platform processing them to deliver the service — we don’t resell your buyer list to other dealers.

**Note:** Point at dealer agreement / DPA / privacy hub if legal asks for paper.

---

### Support & contract

#### Q21. “How long to go live?”

**Say this:** Most yards: provision + shortcode same day; stock CSV + photos in a few hours; WhatsApp once Meta is ready. Target: useful in 48 hours.

**Note:** Meta verification can delay WA only.

---

#### Q22. “Who do we call when something breaks?”

**Say this:** Founder-led support for pilots — hello@grayarx.com / founder cell on the onboarding pack. In Dealer Help chat, say *Report a bug: …* — that opens a ticket and **Kagiso starts investigating**, proposing a fix for founder approval (no silent prod writes). Growth and Multi-site get priority paths; Multi-site includes phone + named contact packaging.

**Note:** Check webhook health first on WhatsApp issues. Fallback inbox messages that clearly report platform errors also queue Kagiso. See `docs/PILOT_SLA.md` for honest response targets.

---

#### Q23. “What’s the contract / pilot terms?”

**Say this:** Pilot agreement and POPIA consent before go-live — dealer agreement and consent form on grayarx.com/legal. Default is **month-to-month** with 30 days’ notice; we also offer a **12-month commit** with founder rate lock if you want price certainty. We don’t lock you into a five-year CRM.

**Written:** Month-to-month (cancel ~30 days) or 12-month commit (rate lock). SLA summary: `docs/PILOT_SLA.md`. Full legal SLA: `docs/legal/SERVICE_LEVEL_AGREEMENT.md`.

**Note:** Send exact URLs from the onboarding checklist; don’t improvise legal terms on the call. Pilot SLA is founder-led response times — not enterprise credit theatre.

---

### Website & integrations

#### Q24. “Can it go on our own website?”

**Say this:** Yes — Dealer → Settings → Website embed. Copy-paste iframe or script. Same shortcode drives book and apply URLs. Works beside your existing site — no full rebuild.

**Note:** WordPress shortcode plugin only if they want `[grayarx_book …]`; plain iframe needs no plugin.

---

#### Q25. “Email / SMS?”

**Say this:** Transactional lead and booking mail is live (Resend). Twilio SMS is optional later — don’t sell it as included today.

**Note:** Never promise SMS as default on Showroom.

---

## 3. Tough objections (say this / never say)

### O1. “Why not just Cars.co.za?”

**Say this:** Keep Cars.co.za — that’s where a lot of demand starts. GrayArx is the always-on reply and booking layer once someone messages you or lands on your showroom. Classifieds get attention; we convert the conversation from your live stock. We are not an ad-buy agency and we don’t replace your listing spend.

**Never say:** “Cars.co.za is useless” / “Cancel your listings.”

---

### O2. “What if AI is wrong and we look stupid?”

**Say this:** We don’t invent cars that aren’t in your inventory. Wrong answers are almost always stale stock — fix the row, mark sold, keep photos/prices current. Anything dicey goes to your human queue with a reference so a salesperson owns the close.

**Never say:** “100% accurate / never hallucinates.”

---

### O3. “Do I need a new WhatsApp number?”

**Say this:** Only if your current number can’t sit on Meta WhatsApp Business / Cloud API. Ideal path: same Business number buyers already use, verified, webhooks on, we link it (auto-link if contact phone matches Meta display). Until then you keep Growth webchat + click-to-chat — not a Showroom downgrade.

**Never say:** “Live on Meta tonight” when unverified or webhooks off. / “No WA Business = you’re on Showroom.”

---

### O4. “Who owns the leads?”

**Say this:** Your dealership. We process them to run Nala, bookings, and your inbox — we don’t shop your leads to the dealer next door.

**Never say:** “We own the data / we can sell your CRM.”

---

### O5. “Will this replace my team?”

**Say this:** It replaces silence after hours — not your closers. Floor still owns trade-in, finance, and the handshake.

**Never say:** “You can fire people.”

---

### O6. “We already pay for Facebook ads / a media buyer.”

**Say this:** Keep them. We make sure the buyers those ads already send you get a fast, accurate answer from your stock — we don’t buy the clicks.

**Never say:** “Fire your agency.”

---

### O7. “Is my data training ChatGPT / OpenAI on my customers?”

**Say this:** We use OpenAI to polish replies when the key and quota are up; otherwise templates. We improve the product from outcomes and FAQs you control — not a pitch that we train foundation models on your buyers. See privacy / POPIA docs for processing detail.

**Never say:** “We train on all your customer chats to make the model smarter for everyone.”

---

## 4. Tier cheat-sheet — what “AI 24/7” means

| | **Showroom** | **Growth** | **Multi-site** |
|--|--------------|------------|----------------|
| **Internal id** | `starter` | `professional` | `enterprise` |
| **AI 24/7 means** | Webchat / showroom assistant within plan caps | Same + WhatsApp Cloud API volume for a busy independent | Same + multi-branch + highest caps |
| **Channels** | Web + click-to-chat | Web + Cloud API WhatsApp | Web + WhatsApp (multi-branch) |
| **Stock ballpark** | ~150 vehicles | ~500 | Fair-use unlimited\* |
| **AI / WA caps** | ~400 AI/mo; no Cloud API bot | ~1,200 AI + ~2,000 WA msgs | ~3,500 AI + ~8,000 WA |
| **Pilot today** | — | **Typical pilot unlock** | Multi-branch when groupKey ops done |

\*Contract fair-use — “large yards welcome; sensible AI caps.”

**One-liner for “AI 24/7”:** The assistant is available every hour buyers message — not that a human salesperson is online at 03:00.

---

## 5. Multi-branch pitch (ops)

**Say this:** Each branch keeps its own stock, WhatsApp number, and shortcode. One `groupKey` links them so managers switch branches without juggling logins. Bill and report per branch cleanly.

**Founder ops (Admin → Dealerships):**
1. Create group (slug).
2. One dealership row per yard.
3. Same `groupKey` on each branch.
4. Each branch: Meta `phone_number_id` + `publicShortcode`.
5. Smoke-test Branch switcher → inventory/leads change.
6. Import CSV **per branch**.

**Note:** Don’t say “live for every dealer on grayarx.com” until that group’s migrate + ops steps are done.

---

## 6. Never-say list

**Never say**
- “It replaces your sales team / fire people.”
- “100% accurate every time” / “never hallucinates.”
- “Live on Meta tonight” when unverified or webhooks off.
- “Multi-branch is live for all dealers” without ops for that group.
- Exact public ZAR if pricing page is still soft — unless founder confirmed.
- “We paste your FNB account in WhatsApp.”
- “Unlimited free AI on thousands of cars with unlimited chats.”
- “POPIA fully handled — you don’t need consent forms.”
- “Twilio SMS is included and live.”
- “OpenAI is required for any reply” — templates cover outages.
- “Manus Forge powers the chat.”
- “Live Cars.co.za sync is included in the pilot.”
- “We train on your customers’ chats.”
- Competitor-bashing by name; US SaaS buzzwords.
- Credit approval, guaranteed sales, or seals we don’t have.

**Prefer instead**
- “Answers from your live stock; humans close the deal.”
- “24/7 assistant — your team still owns negotiation and finance.”
- “WhatsApp once Meta verify + subscribe are done; webchat can start today.”
- “Branches = separate yards, one group key, Branch switcher.”
- “Pilot stock = CSV; classifieds stay for demand.”

---

## Quick reference — product truths (July 2026)

| Truth | Dealer-facing line |
|-------|--------------------|
| Tiers | “Showroom, Growth, Multi-site — pilot is Growth features at a deal we agree.” |
| Pricing | “Public prices soft during pilot.” |
| Channels | “Webchat on Showroom; Cloud API WhatsApp on Growth+.” |
| LLM | “OpenAI when available; templates always have a backstop. No Forge for chat.” |
| STOP | “Buyers reply STOP — automated follow-ups stop; START resumes.” |
| VIN | “Optional; if you enter it, it must be a real 17-character VIN; masked publicly.” |
| Stock | “CSV into your GrayArx inventory — not live Cars.co.za sync yet. Sold stays sold; R1 hidden from public until fixed.” |
| Support | “Bug report → Kagiso investigates → founder approves fix. Pilot SLA in docs/PILOT_SLA.md.” |
| Contract | “Month-to-month or 12-month commit with founder rate lock.” |
| Photos | “External URLs fine; mirroring into our storage is optional.” |
| Learning | “Sharper from outcomes and FAQs you add — not ‘we train on your customers.’” |
| Leads | “Your leads stay yours.” |
| Multi-branch | “One dealership per branch + groupKey + Branch switcher.” |
| Billing | “Stripe and/or FNB EFT on branded invoices when set.” |

---

*End of playbook. Keep answers short. Win first. One Note. Never invent production status.*
