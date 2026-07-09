# Registering GrayArx as a Real South African Business

*A baby-steps guide, written like you've never done this before.*

Author: Manus AI · Updated May 2026

---

## Before you start: what you'll end up with

By the end of this guide you'll have:

1. A registered **Private Company (Pty) Ltd** called **GrayArx (Pty) Ltd** with the **CIPC** (Companies and Intellectual Property Commission) [1].
2. A **company tax number** with **SARS** (South African Revenue Service) [2].
3. A **business bank account** in GrayArx's name (so customers pay GrayArx, not you personally).
4. Proper email on your `grayarx.com` domain (so Mia, Themba, Lerato, and Sipho can actually send and receive mail).
5. **POPIA registration** with the Information Regulator (because you handle dealer + buyer personal data) [3].
6. Optional but smart: a **trademark** on the GrayArx name and a **UIF/COIDA** setup if you hire anyone.

Total cost if you do it yourself: roughly **R 500 – R 1 200**. Total time: about **3–5 working days** if nothing stalls. You can do every step from your laptop.

---

## Step 1 — Get your ID and selfie ready

Before CIPC will talk to you, you need to be verified.

You need:

- Your **South African ID** (smart card or green book).
- A **clear selfie** holding your ID next to your face (CIPC's BizPortal does facial verification).
- A **personal email address** you check daily.
- A **personal cell number** (you'll get OTPs).

Open a folder on your laptop called `GrayArx Admin` and drop a scan of your ID inside. You'll need it five more times in this guide.

---

## Step 2 — Reserve the name "GrayArx" with CIPC

This is where you stake your flag. CIPC will check no other South African company is already called GrayArx.

1. Go to **[bizportal.gov.za](https://www.bizportal.gov.za/)** [4]. This is the easy "everything-in-one-place" version of CIPC.
2. Click **Register a Company**. Create an account using your ID number.
3. Choose **Name Reservation**. Type four name choices in order of preference. Put `GrayArx` first, then backup options like `GrayArx AI`, `GrayArx Technologies`, `GrayArx Holdings`. CIPC checks them in order and reserves the first one that's available.
4. Pay the **R 50** fee with your bank card.

CIPC usually replies within 24 hours by email. When the name is approved, you'll get a **reservation number** — write it down, you'll need it in step 3.

> **Tip:** While you wait, register the social handles `@grayarx` on Instagram, LinkedIn, X, and TikTok with your personal email, so squatters don't take them.

---

## Step 3 — Register the company itself

Same site, same login.

1. Back in BizPortal, click **Register a Company**.
2. Pick **Private Company (Pty) Ltd**. (Don't pick "Non-Profit" or "Personal Liability" — those are for different things.)
3. Use the **name reservation number** from step 2.
4. Fill in:
   - **Registered address**: your home address is fine for now. You can change it later.
   - **Email & cell**: yours.
   - **Directors**: you. (You can add more later if a co-founder joins.)
   - **Shares**: accept the default 1 000 shares unless you have a specific cap-table plan.
5. Pay the **R 175** registration fee.

CIPC issues your **COR14.3 certificate** (the official "GrayArx (Pty) Ltd is alive" document) and a **company registration number** that looks like `2026/123456/07`. Save the PDF in your `GrayArx Admin` folder. You'll show it to banks, SARS, and customers.

---

## Step 4 — Get your tax number from SARS

The good news: this is now **automatic**. When CIPC registers a Pty Ltd, it auto-registers it with SARS in the background and you'll receive an **Income Tax Number** by email within ~48 hours.

If you don't see it after 48 hours:

1. Log in to **[eFiling](https://www.sars.gov.za/individuals/register-for-efiling/)** [5] with your personal credentials.
2. Add **GrayArx (Pty) Ltd** as an organisation (you'll be the "tax practitioner-of-record" for now).
3. Click **Request Tax Number** if it isn't visible.

You don't need VAT registration yet. **VAT is only compulsory when your turnover crosses R 1 million in any rolling 12-month period.** Until then, skip it — it just adds admin.

---

## Step 5 — Open a business bank account

This is the moment GrayArx becomes a real business in everyone's eyes.

The easiest banks for a brand-new Pty Ltd in 2026 are **TymeBank Business**, **Capitec Business**, and **FNB First Business Zero** — all let you open the account online or via app with no in-branch visit and zero monthly fee for the first 6–12 months.

You'll be asked to upload:

- COR14.3 from step 3 (company registration certificate).
- Your ID.
- Proof of residential address (any utility bill from the last 3 months, in your name).
- A short description of what GrayArx does. Use this exact line:

> GrayArx (Pty) Ltd is a software-as-a-service company providing AI sales and customer-service agents to South African motor dealerships. Revenue is generated from monthly subscription fees paid by dealership clients.

Pick the option **"Software / Technology Services"** when asked for industry.

The bank will give you a **business account number** within 24–72 hours. Write the IBAN-style details into your `GrayArx Admin` folder.

---

## Step 6 — Set up real email for `@grayarx.com`

Right now, the agents on the site (mia@grayarx.com, themba@grayarx.com, lerato@grayarx.com, sipho@grayarx.com, hello@grayarx.com) are display addresses only — they aren't real mailboxes yet. Let's fix that.

The cheapest legitimate option is **Zoho Mail Free** (5 users, 5 GB each, free forever for one custom domain) [6]. **Google Workspace** is the premium option at roughly **R 130/user/month** with a much richer experience.

The setup is identical for both:

1. Sign up at **[zoho.com/mail](https://www.zoho.com/mail/)** or **[workspace.google.com](https://workspace.google.com/)** with your personal email.
2. Choose **Add existing domain** and type `grayarx.com`.
3. They give you **MX records** and a **verification TXT record** to add at Namecheap (the same place you set the CNAME for `cname.manus.space` already). Add those records exactly as shown.
4. Wait ~30 minutes for DNS to propagate, then click **Verify**.
5. Create the 5 mailboxes: `hello`, `mia`, `themba`, `lerato`, `sipho`.

> **Important:** Add `hello@grayarx.com` first — that's the only inbox real customers will hit. The others (mia/themba/lerato/sipho) are agent personas that *send* mail; their inboxes auto-forward to `hello@` so a human can take over a conversation when needed.

When you eventually wire the platform's Email Agent to an SMTP provider (e.g. SendGrid), the FROM address will be `mia@grayarx.com` but the SMTP credentials come from SendGrid — Zoho/Google handles the inbound side, SendGrid handles the outbound side.

---

## Step 7 — POPIA: register as a Responsible Party

Because GrayArx collects names, phone numbers, and email addresses of car buyers and dealers, it counts as a **Responsible Party** under POPIA (the Protection of Personal Information Act).

1. Go to **[justice.gov.za/inforeg](https://inforegulator.org.za/)** [3] — the Information Regulator's website.
2. Download the **Information Officer Registration form**.
3. You appoint yourself as the **Information Officer** (the person who answers data-rights complaints). Fill the form in by hand or in a PDF editor.
4. Email the completed form to **inforeg@justice.gov.za** with subject line `Information Officer Registration — GrayArx (Pty) Ltd`.

There is **no fee**. They confirm by reply email within a few weeks. Keep the confirmation forever — you'll cite it on your Privacy Policy.

> The Privacy Policy at `/privacy-policy` on the live site already declares POPIA compliance. After registration, add a single line at the top saying: *"GrayArx (Pty) Ltd is a registered Responsible Party with the Information Regulator (registration date: \[YYYY-MM-DD]). Information Officer: \[your full name]."*

---

## Step 8 — Optional but smart: trademark the name

If GrayArx works, copy-cats will appear. To protect the brand, file a trademark.

You can do it yourself at **CIPC TradeMark eServices** for around **R 590 per class**. For GrayArx you want:

- **Class 9** — software, downloadable applications.
- **Class 42** — Software as a Service (SaaS) and design.

Two classes ≈ **R 1 180**. The process takes 6–12 months but you can call yourself "Trade Mark Pending™" the day you file. Alternatively, an attorney will do it for ~R 4 000 all-in.

This is not urgent. Do it after you sign your first three paying dealerships.

---

## Step 9 — Hiring? Then UIF, COIDA & Employees' Tax

Skip this step for now. The day you hire your first employee (even part-time, even a virtual assistant on a contract) you must:

1. **Register for UIF** at **[ufiling.labour.gov.za](https://www.ufiling.labour.gov.za/uif/)** [7] — unemployment insurance contributions.
2. **Register for COIDA** with the Department of Labour — covers work injuries.
3. **Register for PAYE & SDL** on SARS eFiling — payroll deductions.

Each of those is its own 30-minute process. The current agents (Mia, Themba, Lerato, Sipho) are software, not staff — they don't trigger these registrations.

---

## Step 10 — Your "first day open" checklist

Once steps 1–7 are done, you can run GrayArx like a proper business. On day one, do these five things in order:

1. **Update the site footer** with the company registration number (`Reg No. 2026/______/07`) and registered address. Replace the placeholder address at the bottom of `client/src/components/Footer.tsx`.
2. **Add the registration number to the legal pages** under `/privacy-policy`, `/terms`, and `/dpa` — somewhere near the top.
3. **Send yourself a test email** from `hello@grayarx.com` to make sure inbound works.
4. **Move the Manus secrets** for Twilio and SendGrid from your personal accounts into the GrayArx business accounts (so invoices belong to the company, not you).
5. **Open a separate Notion / Google Drive folder** called `GrayArx — Legal` and store: COR14.3, tax number, bank confirmation letter, POPIA confirmation, and trademark application.

---

## Cost summary

| Item | Once-off | Monthly |
|---|---|---|
| Name reservation (CIPC) | R 50 | — |
| Company registration (CIPC) | R 175 | — |
| Business bank account | R 0 | R 0 for the first 6–12 months, then ~R 60 |
| Zoho Mail Free | R 0 | R 0 |
| Google Workspace (alternative) | — | R 130 / user |
| POPIA Information Officer registration | R 0 | — |
| Trademark (2 classes, DIY) | R 1 180 | — |
| **Total to be officially open** | **~R 225** | **~R 0–60** |

---

## What to do *this week*

If you only have one hour, do this:

1. **Today**: complete steps 1–3 on BizPortal. R 225 spent, GrayArx (Pty) Ltd legally exists.
2. **Tomorrow**: open the bank account (step 5). Use the COR14.3 from yesterday.
3. **The day after**: set up Zoho/Workspace email (step 6) and send a POPIA form (step 7).

That's it — by Friday, GrayArx is real. The agents on the site, the contact number, and the legal pages all become legitimate ownership claims by an actual registered SA company.

---

## References

1. CIPC — Companies and Intellectual Property Commission. *Register a Company*. <https://www.cipc.co.za/?page_id=3045>
2. SARS — South African Revenue Service. *Companies Income Tax*. <https://www.sars.gov.za/businesses-and-employers/companies/>
3. Information Regulator of South Africa. *POPIA & PAIA*. <https://inforegulator.org.za/>
4. BizPortal. *Register your company in 24 hours*. <https://www.bizportal.gov.za/>
5. SARS eFiling. <https://www.sars.gov.za/individuals/register-for-efiling/>
6. Zoho Mail. *Free business email on your domain*. <https://www.zoho.com/mail/zohomail-pricing.html>
7. uFiling — Department of Employment and Labour. <https://www.ufiling.labour.gov.za/uif/>
