# Merge this Cloud Agent work into Greyhawks / Grayarx-Final

## Why you can’t “merge” from this session alone

This Cloud Agent only has the **temporary Origin repo**  
`origin.cursor.com/git/henrique-dev/tmp-d7ecd6d0851e2cc8`.

It **cannot see**:

- your desktop `Grayarx-Final` folder  
- production `grayarx.com` secrets  
- OPENAI / Meta / Resend already living in that platform  

**Correct move:** open a Cloud Agent **on Grayarx-Final / Greyhawks**, then port (or cherry-pick) from this branch:

`cursor/sales-funnel-playbook-ec24`

Until then, keep shipping here as a **merge-ready pack**.

---

## What to copy into Grayarx-Final (priority order)

### A. Sales / Themba (already started)
- `lib/call-agent-*.ts`, `lib/sales-templates.ts`, `lib/call-stages.ts`, `lib/call-intel.ts`
- `app/api/call-agent/reply`
- `app/api/twilio/voice/*`, `app/api/prospector/*`
- `app/admin/prospector`, `components/prospector/*`
- `lib/prospector-data.ts` (**50+ ICP yards**), `lib/prospector/import.ts`

### B. Dealership OS (Nala)
- `lib/os/*`, `lib/conversion/*`, `lib/billing/*`, `lib/regions/*`
- `lib/dealership/*`, `lib/whatsapp/*`, `lib/email/*`, `lib/crm/*`
- `lib/marketplace/*`, `lib/finance/*`, `lib/branches/*`, `lib/value/*`, `lib/processes/*`
- APIs under `app/api/os`, `parts`, `conversion`, `marketplace`, `billing`, `pricing`, `regions`, …
- UI: `app/dealer`, `app/admin/os`, `app/admin/pricing`, `app/showroom`, …

### C. Docs / pricing
- `docs/PRICING.md`, `HOW_GRAYARX_WORKS.md`, `GLOBAL_EXPANSION.md`, battlecards

### D. Do **not** overwrite on Final
- `.env` / `.env.local` (keep their OpenAI, Meta, Resend, Twilio)
- Production DB / Prisma schema without a migration plan
- Existing WhatsApp webhook routes — **wire** Nala into them, don’t delete

---

## Env already on Final → what each unlocks

| Secret on Final | Unlocks |
| --- | --- |
| `OPENAI_API_KEY` | Nala polish (templates still always work) |
| `META_WHATSAPP_TOKEN` + `PHONE_NUMBER_ID` | Real buyer WhatsApp |
| `RESEND_API_KEY` | Real Monday ROI email |
| `TWILIO_*` + from number | Themba live dial |

After merge, hit `/api/billing/usage` and send one test WhatsApp — confirm channel is `meta` not `mock`.

---

## Merge verification checklist

1. `npm test` + `npm run smoke` on Final  
2. `/dealer` value calc shows local fee  
3. `/admin/prospector` shows **50+** prospects + CSV import  
4. `/admin/pricing` + `/api/regions?region=US` show USD (etc.)  
5. Live Meta WA to your phone  
6. Resend Monday email to you  
7. Twilio only blocked on SA from-number if Gray Ox pending  

---

## After merge — sales motion

1. Filter prospector: **ZA + high ability**  
2. Paste real phones from AutoTrader listings  
3. Call from your mobile with Practice funnel (until Themba dials)  
4. Pilot → Monday proof → Professional close  
5. Parallel: AU/UK/UAE list with local currency packages  
