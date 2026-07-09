# GrayArx — What I Need From You, In Baby Steps

Read this like a checklist. Each row tells you **what** to give me, **where** to get it, **how much** it costs in rand, and **what to paste back to me** when you have it.

When you have an item, just reply in chat with the value (or upload a screenshot) and say *"add this"*. I'll wire it in within minutes and test it.

---

## How To Read This Document

| Column | Meaning |
|---|---|
| **What** | The thing I need from you |
| **Why** | What unlocks once you give it to me |
| **Where** | Exact website + step-by-step to get it |
| **Cost** | Rough rand cost (May 2026 rates) |
| **What to paste back** | The exact format I need |

Anything marked **🔴 essential** is required to actually go live and start making money. Anything **🟡 nice-to-have** can wait until your second month.

---

## 🔴 Section A — Essential (do these first, in order)

### A1. Twilio account (so Themba can make real phone calls)

| | |
|---|---|
| **What** | A Twilio account with one purchased South African phone number |
| **Why** | Without it, when a prospect is "queued for call" nothing actually happens. With it, Themba dials within 30 seconds. |
| **Where** | 1. Go to **twilio.com** → click **Sign up**. 2. Use your business email (`heshen@grayarx.com` once it's set up — for now your personal email is fine). 3. Verify your cell with the SMS code. 4. In the Twilio Console go to **Phone Numbers → Buy a number → Country = South Africa → Voice capable**. Pick one (a Cape Town `+27 21` or Johannesburg `+27 11` number looks professional). 5. After purchase, in the Console look in the top-left widget for **Account SID** and **Auth Token** (click the eye icon to reveal). |
| **Cost** | • SA phone number: ~R 25 / month (US $1.15) <br>• Voice calls: ~R 0.45 – R 0.90 per minute outbound to SA mobiles <br>• Top up your wallet with **R 500** to start — that's about 800 minutes of calling |
| **What to paste back** | `TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxx`<br>`TWILIO_AUTH_TOKEN = xxxxxxxxxxxxxxxx`<br>`TWILIO_FROM_NUMBER = +27xxxxxxxxx` |

> Once I have these three values, I'll plug them in, send a test call to your number 079 491 5187 so you can hear Themba speak, then mark the Calling Agent as **🟢 LIVE** in the Agents Command Centre.

---

### A2. Email sender (so Mia can actually send the drafts she's writing)

You have two cheap options. Pick **one**.

#### Option A2a — **Resend** (recommended, simplest)

| | |
|---|---|
| **What** | A Resend account + verified `grayarx.com` domain |
| **Why** | Right now Mia writes the reply and stores it in the activity log. With Resend wired in, the email actually leaves the system and lands in the prospect's inbox from `mia@grayarx.com`. |
| **Where** | 1. Go to **resend.com** → **Sign up** (Google sign-in works). 2. Sidebar → **Domains** → **Add Domain** → type `grayarx.com`. 3. Resend will show you **3 DNS records** (one SPF, one DKIM, one MX optional). 4. Open your **Namecheap → Advanced DNS** tab (same place we did the website DNS) and add those three rows exactly as Resend shows. 5. Wait 10 minutes, then click **Verify** in Resend. 6. Once verified, sidebar → **API Keys** → **Create API Key** → name it `grayarx-prod`. Copy the value (starts with `re_…`). |
| **Cost** | • **Free tier: 100 emails/day, 3 000/month** — perfect for the first 50 dealers <br>• Paid tier kicks in at $20 / month (~R 370) for 50 000 emails/month |
| **What to paste back** | `RESEND_API_KEY = re_xxxxxxxxxxxxxxxx`<br>`MAIL_FROM_DOMAIN = grayarx.com` |

#### Option A2b — **SendGrid** (alternative)

Same flow, but at **sendgrid.com**. Free tier is 100 emails/day. Twilio owns it, so if you already have a Twilio login it's one less account.

> Once email is wired, every Mia draft on the Agents page will get an **[ Send via email ]** button that actually ships it. The glow-logo HTML signature I built is already attached to every reply.

---

### A3. Your business documents (so we can register a company)

I already wrote the full step-by-step in `GRAYARX_COMPANY_REGISTRATION.md`. The shortest possible version of what you need to put GrayArx on a CIPC certificate:

| | |
|---|---|
| **What** | Your South African ID number, residential address, and a proposed company name |
| **Why** | Without a registered company you can't open a business bank account, can't issue invoices with VAT, and can't sign customer contracts. |
| **Where** | CIPC (Companies and Intellectual Property Commission) — **eservices.cipc.co.za** |
| **Cost** | • Company name reservation: **R 50** <br>• Pty (Ltd) registration: **R 175** <br>• Bank-Verified ID upload: free |
| **What to paste back** | When you've registered (or if you want me to walk you through it screen-by-screen), send me: `Company name: GrayArx (Pty) Ltd`, `Registration number: 2026/xxxxxx/07`, `Registered address: …`. I'll put it in the website footer, the legal pages, and every email signature automatically. |

> Until you register, the site keeps showing "GrayArx — Powered by Manus" in legal footers. That's fine for the trial period but will need to be replaced before you charge real money.

---

### A4. SARS tax number (so you can charge VAT)

| | |
|---|---|
| **What** | A SARS Income Tax reference number (you probably already have one if you've ever worked in SA), and once you make over R 1 million / year in revenue, a VAT number too. |
| **Why** | Below R 1m turnover/year you don't need VAT registration — you can charge prices "VAT-inclusive" and just pocket the lot as income (declared on your personal tax return if you trade as sole proprietor, or on the company's CIT return once registered). Above R 1m you **must** register for VAT within 21 days. |
| **Where** | **sars.gov.za** → eFiling. If you don't have an eFiling login, register with your ID number. |
| **Cost** | Free |
| **What to paste back** | `Income tax number: xxxxxxxxxx` (10 digits). Save the VAT number for when you cross R 1m. |

---

### A5. Business bank account (so dealers can pay you)

| | |
|---|---|
| **What** | A South African business bank account in the company's name |
| **Why** | You can't legally accept dealer subscriptions into your personal account once GrayArx is a Pty (Ltd) — and the major payment processors (Yoco, Stitch, Peach, PayFast, Stripe SA) all require a business account to settle into. |
| **Where** | Cheapest options in May 2026: <br>• **FNB First Business Zero** — R 0/month for the first 12 months, then R 95/month. Online application, takes ~3 days. <br>• **TymeBank Business** — R 0/month forever, opens in 5 minutes online with your ID, but no branch network if you need it. <br>• **Capitec Business** — R 75/month, decent app. <br>• **Discovery Business Bank** — R 0/month, slick app, but requires Discovery Bank personal account first. |
| **Cost** | R 0 – R 95 / month depending on bank |
| **What to paste back** | Just confirm the account is open. I don't need the account number — that goes to your payment processor (next item), not the website. |

---

### A6. Payment processor (so dealers can subscribe online)

| | |
|---|---|
| **What** | A way to charge R 1 499 or R 3 499 every month to a dealer's card automatically |
| **Why** | Without it, every renewal requires a manual EFT confirmation. With it, the Dashboard shows "Active subscriptions: 23" and the money lands in your bank account each month with no work. |
| **Where (recommended)** | **Stitch Money** (stitch.money) — South African, built for recurring billing, supports debit orders + cards + EFT. Sign up online, takes ~5 days for FICA. |
| **Where (alternative)** | • **Yoco** — easier to start, R 0/month, **2.95 % per transaction**. Card-only, no debit orders. <br>• **PayFast** — long-established, **3.5 % per transaction**, supports debit orders. <br>• **Peach Payments** — enterprise-y, **2.85 % + R 1.50 per transaction** <br>• **Stripe SA** — finally launched fully in SA in 2025, **2.95 % + R 1.50 per transaction**, best developer experience |
| **Cost** | • Setup: usually free <br>• Per transaction: **2.85 % – 3.5 %** <br>• At R 3 499 / dealer / month, that's R 100 – R 122 in fees per dealer per month — already baked into the pricing model |
| **What to paste back** | Whichever you pick, copy the **API public key** and **API secret key** from their dashboard and paste them in chat. I already have Stripe partially wired (the project supports `webdev_add_feature stripe` out of the box), so if you choose Stripe I can have checkout pages live within an hour. |

---

## 🟡 Section B — Nice-to-have (do these in month 2)

### B1. A real photo of you (and your team, when you hire them)

I'll add an **"About"** section to the homepage with your face and a one-paragraph story. SA dealers buy from people, not faceless software. Just send me a clear well-lit headshot (phone selfie is fine) plus your title (probably "Founder & CEO").

**What to paste back:** A photo file in chat, plus 2–3 sentences in your own voice about why you started GrayArx.

### B2. A SaaS-grade logo glyph file (vector, not just the PNG we have)

The glowing "GA" mark I generated is a PNG — beautiful but pixel-based. For business cards, signage, and HD video calls you'll want a **vector SVG** version.

| Where to get one | Cost |
|---|---|
| **Fiverr** ("logo redraw to vector") | R 200 – R 500, 24-hour turnaround |
| **99designs** ("logo redesign brief") | R 5 000 – R 12 000, full contest, 7 days |
| **Penji** subscription | R 8 500 / month flat |

For just a vector redraw of the existing logo, Fiverr is plenty.

### B3. A Google Business Profile

Free. Go to **business.google.com** → claim "GrayArx" → enter your registered address (or "service area: South Africa" if you don't have an office). This gets you on Google Maps when dealers search for "AI dealership software South Africa" and lets reviews accumulate.

### B4. POPIA Information Officer registration

Required by law for any business that handles personal info (which is literally every SaaS). Register yourself as Information Officer at the **Information Regulator** website: **inforegulator.org.za** → Information Officer Registration. **Free.** Takes 10 minutes.

**What to paste back:** Your Information Officer registration reference number — I'll add it to the Privacy Policy footer.

### B5. POPIA Privacy Officer training

Optional but smart. **POPIAct-Compliance.co.za** runs online courses for ~R 1 500. Or watch the free YouTube series by **Michalsons Attorneys** if you're DIY.

---

## 🟢 Section C — Already done (you can ignore this section, just here for the record)

These are things that are *already configured* and don't need anything from you:

| Item | Status |
|---|---|
| `grayarx.com` domain | ✅ Bought, DNS pointed to Manus, awaiting publish |
| `www.grayarx.com` subdomain | ✅ Linked |
| Site published to Manus hosting | 🟡 Pending — click **Publish** in the Manus right-side panel when ready |
| Owner phone number (079 491 5187) | ✅ Wired into footer, contact section, and every email signature |
| 7-language switcher | ✅ Live (EN, AF, ZU, XH, ST, TN, VE) |
| Multilingual AI guardrails | ✅ Live, 22 stress tests passing |
| All 4 AI agents (Mia, Themba, Lerato, Sipho) | ✅ Live with portrait avatars and AI badges |
| POPIA-compliant legal pack (6 docs) | ✅ Live at `/privacy`, `/terms`, `/ai-ethics`, `/dpa`, `/aup`, `/sla` |
| Mobile-responsive design | ✅ Tested on 375 px width |
| Phone-camera vehicle photo upload | ✅ Live in Inventory page |
| Owner Dealerships admin view | ✅ Live at `/dealer/dealerships` |
| Public Dealer Network gallery | ✅ Live at `/dealer/network` |
| Public shareable vehicle pages | ✅ Live at `/showroom/:id` |
| Nightly Prospector schedule (rotates SA regions weekly) | ✅ Scheduler installed; enable from `/dealer/prospects` |

---

## TL;DR — The Five Things That Actually Matter This Week

1. Open a **Twilio** account, buy one SA number, top up R 500, paste me the three values from A1.
2. Open a **Resend** account, verify `grayarx.com`, paste me the API key from A2a.
3. Register **GrayArx (Pty) Ltd** at CIPC (R 225 total, takes 1 evening).
4. Open a free **TymeBank Business** or **FNB First Business Zero** account.
5. Sign up for **Stitch** or **Yoco**, paste me the API keys.

Once those five are in, GrayArx can take real money from real dealers. Everything else is polish.

---

If anything in this list is unclear, just reply with the row number ("What's A2 again?") and I'll walk you through it screen-by-screen.
