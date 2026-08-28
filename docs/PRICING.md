# GrayArx pricing & unit economics (sell + stay profitable)

## What we charge (updated)

| Plan | Price | Included WA | LLM polish | Overage | Who |
| --- | --- | --- | --- | --- | --- |
| **Pilot** | **R0 / 14 days** | 150 hard cap | 150 | — | Prove Monday numbers |
| **Starter OS** | **R7,990/mo** | 1,000 | 1,000 | R0.85/conv | Sales + recovery yards |
| **Professional OS** | **R14,990/mo** | 3,500 | 3,500 | R0.75/conv | Full OS (hero) |
| **Enterprise OS** | **From R29,990/mo** | 12,000 | 12,000 | R0.55/conv | Multi-yard + SLA |

### How caps implement (not just marketing numbers)
1. Choosing a plan on the dealership (`planId`) **loads these caps automatically**.
2. Each unique buyer WhatsApped that month burns 1 WA conversation.
3. Nala always drafts a **template** from live stock/parts first.
4. Optional OpenAI **polish** burns 1 polish credit; when credits/quota run out → **auto template mode** (buyer still answered).
5. Pilot hard-stops WA. Paid plans continue with overage so we stay profitable.

See `docs/HOW_GRAYARX_WORKS.md` and `GET /api/billing/usage`.

## What it costs us (est. ZAR / yard / month)

| Cost | Starter | Professional | Enterprise |
| --- | --- | --- | --- |
| LLM (Nala) | R1,200 | R2,800 | R6,000 |
| WhatsApp Meta | R800 | R2,000 | R5,000 |
| Twilio | R400 | R800 | R2,000 |
| Hosting | R200 | R350 | R1,000 |
| Email | R50 | R80 | R200 |
| Support | R800 | R1,200 | R3,000 |
| Contingency 15% | R520 | R1,080 | R2,580 |
| **Total COGS** | **~R3,970** | **~R8,310** | **~R19,780** |

## Margin

| Plan | Price | COGS | Gross margin |
| --- | --- | --- | --- |
| Starter | R7,990 | ~R3,970 | **~50%** |
| Professional | R14,990 | ~R8,310 | **~45%** |
| Enterprise | R29,990 | ~R19,780 | **~34%+** at floor (quote up for heavy groups) |

Overage exists so a quiet-priced yard that suddenly does 10k chats doesn’t wipe margin.

## Pilot economics
We absorb ~R1.4k COGS for 14 days (capped 150 WA). Only extend free if Monday proof is in play. Never run uncapped free forever.

## Dealer value check
Default leakage calculator still shows **~R150k–R190k/mo GP at risk** vs **R14,990** fee → still a no-brainer for the yard, and profitable for us.

## Rules
1. Don’t discount below Starter list without cutting included conversations.  
2. Professional is the default close after pilot.  
3. Enterprise always custom-scoped if >3 yards or OEM integrations.  
4. Revisit COGS quarterly (Meta/OpenAI/Twilio price changes).

Live: `/admin/pricing` · `/api/os` → `economics` · `/dealer`
