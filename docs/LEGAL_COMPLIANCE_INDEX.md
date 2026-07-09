# GrayArx legal & compliance index

Master checklist for South African regulatory requirements. Last reviewed: **9 July 2026**.

## Public website (live routes)

| Document | URL | Source |
|----------|-----|--------|
| Privacy Policy (POPIA) | `/privacy-policy` | `docs/legal/PRIVACY_POLICY.md` |
| Terms of Service | `/terms` | `docs/legal/TERMS_OF_SERVICE.md` |
| AI Ethics & Transparency | `/ai-ethics` | React page |
| Data Processing Agreement | `/dpa` | `docs/legal/DATA_PROCESSING_AGREEMENT.md` |
| Acceptable Use Policy | `/aup` | `docs/legal/ACCEPTABLE_USE_POLICY.md` |
| Service Level Agreement | `/sla` | `docs/legal/SERVICE_LEVEL_AGREEMENT.md` |
| Credit & Finance Disclaimer | `/credit-disclaimer` | `docs/legal/CREDIT_DISCLAIMER.md` |

All linked from site footer (`client/src/components/Footer.tsx`).

## South African law mapping

| Law | GrayArx obligation | Status |
|-----|-------------------|--------|
| **POPIA** (Protection of Personal Information Act) | Privacy policy, lawful processing, consent, Information Officer, breach notification | ✅ Policy live; consent in onboarding/sign-up; `server/_core/popiaConsent.ts` |
| **CPA** (Consumer Protection Act) | Fair marketing, clear pricing, no misleading AI claims | ✅ Terms + AI ethics; pilot pricing confirmed in writing |
| **NCA** (National Credit Act) | No unlicensed credit offers; disclaimers on finance/trade-in tools | ✅ `/credit-disclaimer` + inline Finance page warnings |
| **PAIA** (Promotion of Access to Information Act) | Manual + request process | ✅ Referenced in Privacy Policy |
| **ECTA** (Electronic Communications & Transactions Act) | Valid electronic contracts, consent to electronic comms | ✅ Sign-up terms acceptance; email footers |
| **RICA** (if voice/SMS) | Lawful interception, customer consent for recordings | ⚠️ Voice features — confirm recording disclosure per dealer |
| **FAIS** (if dealer offers finance) | Dealer remains licensed FSP; GrayArx is software only | ✅ Credit disclaimer + dealer agreement |

## Email & direct marketing (POPIA s.69)

| Requirement | Implementation |
|-------------|----------------|
| Identify sender | `pilot@grayarx.com` / `hello@grayarx.com` via Resend |
| Business purpose | Pilot outreach to publicly listed dealership contacts |
| Opt-out | Reply "unsubscribe" or `hello@grayarx.com`; footer in `shared/emailBranding.ts` |
| Privacy link | Footer links to `/privacy-policy` |
| AI disclosure | Footer: "AI-assisted communications disclosed" |

## Product consent flows

| Flow | Location | Notes |
|------|----------|-------|
| Account sign-up | `/signup` | Terms + Privacy checkbox required |
| Pilot application | `/onboarding` | Privacy + Terms + DPA consent text |
| POPIA modal (customers) | `popiaConsent.ts` | Backend ready; UI modal temporarily disabled — re-enable when DB stable |
| Dealer onboarding | `docs/PILOT_ONBOARDING_CHECKLIST.md` | Signed dealer agreement + POPIA consent form |

## Internal / contract templates (not public routes)

| Document | Path | When used |
|----------|------|-----------|
| Dealer Agreement | `docs/legal/DEALER_AGREEMENT.md` | Pilot contract — sign before go-live |
| POPIA Consent Form | `docs/legal/POPIA_CONSENT_FORM.md` | Per-dealer data processing consent |
| Liability & Indemnification | `docs/legal/LIABILITY_INDEMNIFICATION.md` | Schedule to dealer agreement |

## Key contacts (must be monitored mailboxes)

| Role | Email |
|------|-------|
| General / unsubscribe | hello@grayarx.com |
| Privacy / Information Officer queries | privacy@grayarx.com |
| AI ethics | ethics@grayarx.com |
| Pilot outreach | pilot@grayarx.com |

## Open items (non-blocking for pilot)

- [ ] Complete `[TO BE COMPLETED]` placeholders in dealer agreement (company reg, VAT)
- [ ] Formal attorney review of all `docs/legal/*` templates
- [ ] Re-enable POPIA consent modal in `App.tsx` when DB migration stable
- [ ] Dedicated `unsubscribe@grayarx.com` auto-handler (optional)
- [ ] PAIA manual PDF download on `/privacy-policy` (optional)

## Verification commands

```bash
# Send branded pilot test email (Resend)
npx tsx scripts/send-pilot-test-email.ts grayarx@gmail.com resend

# Run legal-related tests
pnpm vitest run server/pilotEmailCampaign.test.ts shared/emailBranding.test.ts
```

## Change log

| Date | Change |
|------|--------|
| 9 Jul 2026 | Email footer: privacy, terms, unsubscribe (POPIA s.69); sign-up terms checkbox; credit disclaimer page; this index |
