# GrayArx, Explained Like You're Five

A plain-English walkthrough of how your dealership platform works — what every page does, what every "agent" does, and what happens behind the scenes when a button gets clicked.

---

## 1. The Big Idea in One Sentence

GrayArx is a **little robot team** that lives on your website. It finds people who want to buy cars, talks to them politely day and night, books test drives, and tells you who is most likely to actually buy — so you and your salespeople can stop wasting time and focus on closing.

You own the dealership. GrayArx is the staff that never sleeps.

---

## 2. The Two Sides of the Platform

Think of GrayArx as a **building with two doors**.

### Door A — The Public Side (anyone on the internet)

This is what a regular car buyer sees when they visit **grayarx.com**. It's polished, dark, and gold, and it tries to do two things: (a) make buyers fill in their details so you get a lead, and (b) make dealership owners sign up so you get a customer.

It has these rooms:

| Page | What it is for | Who walks in |
|---|---|---|
| **Home** | The marketing pitch — hero, four agents, features, pricing, contact | Anyone |
| **Showroom** | A pretty grid of cars with an AI search box | Buyers |
| **Showroom / [car id]** | A full public listing of one car — gallery, price, share buttons | Buyers (often clicked from a WhatsApp link a dealer sent them) |
| **Pricing** | The same pricing section as Home, but as its own page | Dealer prospects |
| **Legal pages** | Privacy, Terms, AI Ethics, DPA, AUP, SLA — all written to comply with South Africa's POPIA law | Anyone who needs the small print |
| **Login** | A branded sign-in page for dealers | Dealership owners and their staff |

### Door B — The Dealer Side (only people who sign in)

After a dealer signs in, they enter their private dashboard. This is the cockpit that runs their dealership. None of this is visible to the public.

| Page | What it is for |
|---|---|
| **Dashboard** | The "morning coffee" view — how many leads today, conversion %, charts, live activity feed |
| **Leads** | Every person who filled in a form, with status dropdowns (new → contacted → qualified → won/lost) |
| **Bookings** | Every test-drive booking, with confirm/cancel buttons |
| **Inventory** | The dealer's own car stock — add, edit, delete vehicles. These are what the public Showroom shows |
| **Prospector** | The robot business-development scout — finds *other* dealerships you could sell GrayArx to (or that you could partner with). More on this below |

---

## 3. The Four AI Agents (the actual "magic")

These are the four little robots that do work for you. Each one has a job. They run on the server, not in the browser, so they keep working even when you close your laptop.

### Agent 1 — The Email Agent ✉️

> Replies to lead emails within seconds, in the language the customer wrote in. Never sleeps. Never forgets to follow up.

When someone fills the **Lead Capture form** on the homepage, it lands in your database. The Email Agent picks it up, drafts a warm, on-brand reply, and follows up at smart intervals (day 1, day 3, day 7). If the lead replies, it keeps the conversation going until either the lead books a test drive or asks to be left alone.

### Agent 2 — The Calling Agent 📞

> Picks up the phone. Sounds human. Books test drives.

When a lead has a phone number, or when the Prospector hands off a hot dealership prospect, the Calling Agent **actually places an outbound phone call** through Twilio. It uses a South African English voice, introduces itself as a GrayArx AI assistant, and either (a) qualifies the buyer, or (b) pitches the dealership.

Every call is logged in a `call_attempts` table — who was called, when, the call SID, and the result. If Twilio credentials are not yet set up, the agent gracefully **skips the call** but still moves the prospect to "queued for call" so nothing breaks.

### Agent 3 — The Booking Agent 📅

> Owns your test-drive calendar.

When a customer says yes to a test drive (through email, WhatsApp, or the **Book Demo** button), the Booking Agent finds a free slot, creates a booking row in the database, sends a confirmation, and gives the dealer one-click confirm/cancel inside the dashboard.

### Agent 4 — The Prospector Agent 🔭 (the newest one)

> Goes hunting for *new dealerships* every night while you sleep.

This is the business-growth engine. Once a night, at **05:00 South African time**, a scheduled job wakes up and asks an LLM to generate five realistic potential dealership prospects in one South African province. The province rotates through all nine each week, so over seven days you get full national coverage.

Each prospect comes with: dealership name, region, city, phone, email, website, estimated monthly volume, brands carried, a **fit score (0–100)**, and a one-sentence rationale. They land in the **Prospects** page of your dashboard.

You then click **"Hand off"** on any prospect with a good score. That hand-off triggers the Calling Agent (Agent 2) to actually call them with a personalised pitch.

You can also **pause, resume, or delete** the nightly schedule from a single button on the Prospects page.

---

## 4. The Magic Trick: What Happens When a Lead Submits the Form

This is the most important flow on the public side. Step by step:

1. A buyer types their name, phone, and "Looking for: 2020 Mercedes E-Class" into the form on the homepage.
2. The browser sends that data to `trpc.leads.create`, a protected API endpoint on the GrayArx server.
3. The server saves a new row in the `leads` table in your MySQL database.
4. The server fires `notifyOwner()` — meaning *you* (the project owner, +27 79 491 5187) get a real-time push notification: "New lead: John, looking for Mercedes E-Class."
5. The dealer's Dashboard updates in real time (the activity feed and KPIs both refetch).
6. The Email Agent picks up the new lead within seconds and starts a warm conversation.
7. If the lead has a phone number and asks "can someone call me?", the Calling Agent dials them.
8. If the lead books a test drive, the Booking Agent creates the booking row, which lands in your Bookings page.

You never touched a thing. The robots did it.

---

## 5. The Database — Where Everything Lives

The database is just an Excel spreadsheet on steroids. It has a few important tables:

| Table | What's in it |
|---|---|
| `users` | Every dealer/staff member who has signed in via Manus OAuth |
| `leads` | Every buyer who filled in a form — name, phone, email, interest, status |
| `bookings` | Every test-drive appointment — vehicle, customer, date/time, status |
| `vehicles` | The dealer's car inventory — make, model, year, price, photos, status |
| `conversations` | A log of every message exchanged between an agent and a lead |
| `prospects` | Dealerships that the Prospector Agent has scouted — fit score, status |
| `call_attempts` | Every outbound phone call placed by the Calling Agent — SID, status, duration |

Every important timestamp is stored in UTC. The frontend converts it to South African local time when it shows it to you.

---

## 6. Languages

The platform speaks **all eleven South African official languages**: English, Afrikaans, isiZulu, isiXhosa, Sesotho, Setswana, Sepedi (Sesotho sa Leboa), Xitsonga, siSwati, Tshivenḓa, and isiNdebele — plus Portuguese for Mozambican customers. The little globe icon in the top-right lets a visitor switch. Their choice is saved in their browser so the next time they come back, the site greets them in their language.

(Right now, navigation, the hero, CTAs, and trust signals are fully translated. Agent emails and voice responses are also generated in the customer's language automatically — that part is done by the LLM at runtime, not by static translation files.)

---

## 7. Compliance — Why Legal Matters in South Africa

South Africa has **POPIA** (Protection of Personal Information Act). It says: if you collect someone's data, you must tell them why, store it safely, and let them delete it.

The platform ships with **six legal pages** written specifically for POPIA:

1. **Privacy Policy** — what data we collect and why
2. **Terms of Service** — the rules of using the platform
3. **AI Ethics & Transparency** — when an AI is talking, we say so
4. **Data Processing Agreement** — for dealers who need a formal contract
5. **Acceptable Use Policy** — no spam, no fraud, etc.
6. **Service Level Agreement** — 99.5% uptime guarantee

These are linked in the footer of every page.

---

## 8. The Owner-Contact Story (Your Phone Number)

Your number **+27 79 491 5187** is wired into three places:

1. **The footer** of every page — with a click-to-call link and a WhatsApp link.
2. **A dedicated Contact section** on the homepage, just above the footer, with three big cards: Call, WhatsApp, Email.
3. **The demo-confirmation flow** — when a dealer books a demo, the success message tells them you'll WhatsApp them on that number.

This means a curious dealer is never more than two clicks away from talking to a real human (you).

---

## 9. How Things Run in the Background (The Boring But Important Bit)

A few things happen on a schedule without anyone clicking anything:

- **Nightly Prospector** — 05:00 SAST every day. Rotates SA provinces. Adds 5 new prospects.
- **OAuth session refresh** — automatic, behind the scenes, so dealers stay signed in for a year.
- **Database connection pooling** — handled by Drizzle ORM; you never think about it.

If you ever want to pause the nightly Prospector (e.g., on weekends), just click the pause button on the Prospects page.

---

## 10. The Domain Setup (What You Just Did in Namecheap)

You pointed your real domain, **grayarx.com**, at the Manus servers using two DNS records:

| Type | Host | Value | What it means |
|---|---|---|---|
| ALIAS | `@` | `cname.manus.space.` | "grayarx.com lives at the Manus address" |
| CNAME | `www` | `cname.manus.space.` | "www.grayarx.com lives at the same place" |

DNS is just the **phonebook of the internet**. You updated the phonebook entry. Once it spreads (10 min – 2 hours), anyone typing `grayarx.com` or `www.grayarx.com` lands on your site instead of the old Lovable one.

---

## 11. What's Inside the Code (Just So You Know)

| Folder | What's in it |
|---|---|
| `client/src/pages` | Every page (Home, Showroom, Dashboard, Prospects, Login, Legal, etc.) |
| `client/src/components` | Reusable building blocks (Navigation, Footer, DealerShell, Logo) |
| `client/src/lib` | The tRPC client + i18n + shared contact constants |
| `server/routers.ts` | Every backend API endpoint — `leads.create`, `prospects.scout`, `dealer.stats`, etc. |
| `server/db.ts` | Database query helpers (one function per question you ask the DB) |
| `server/_core/calling.ts` | The Twilio outbound-call helper |
| `server/_core/scheduled.ts` | The nightly Prospector handler |
| `drizzle/schema.ts` | The shape of every database table |

If you ever want to change a sentence on the homepage, it's in `client/src/pages/Home.tsx`. If you want to change a price, it's also in `Home.tsx` near the bottom.

---

## 12. The "What's Next" Map

The platform is fully functional. To take it from "fully functional" to "running a real dealership", here's the recommended order of next moves:

1. **Connect Twilio** — give me your Twilio Account SID, Auth Token, and From Number, and the Calling Agent will start placing real phone calls within 5 minutes.
2. **Connect a real SMTP / SendGrid sender** — so the Email Agent's replies come from `hello@grayarx.com` instead of a dev sender.
3. **Add WhatsApp Business** — Twilio also runs WhatsApp; once connected, agents can chat on WhatsApp too.
4. **Onboard your first 3 dealers** — give them logins, let them upload inventory, and watch the dashboard light up.
5. **Watch the Prospector** for one week — every morning you'll have ~5 new prospects across SA. Hand off the ones with a fit score above 80 to the Calling Agent and let it pitch them.

---

## 13. The One-Sentence Summary for Each Page

If a friend ever asks "what's that website do?", here's the answer for each room:

- **Home** — "It's a 24/7 AI sales team for car dealerships in South Africa."
- **Showroom** — "Cars for sale. Ask the AI what fits your life."
- **Pricing** — "Three plans, in Rands. No credit card to start."
- **Dashboard** — "Where the dealer sees everything happening today."
- **Leads** — "Every buyer who raised their hand."
- **Bookings** — "Every test drive scheduled."
- **Inventory** — "Your stock list. What's on the showroom floor."
- **Prospects** — "The robot scout's nightly list of dealerships to call."
- **Login** — "Where staff get in."
- **Legal** — "The small print, written for POPIA."

---

## 14. The One Number That Matters

If anything ever feels confusing, or a customer wants to talk to a real person, the answer is always the same:

> **Call or WhatsApp +27 79 491 5187.**

That's wired into the footer, the homepage contact section, and the demo confirmation. It is the human escape hatch on every page.

---

*Built with care for South African dealerships. — Manus AI*
