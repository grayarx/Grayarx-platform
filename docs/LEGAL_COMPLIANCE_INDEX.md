# GrayArx legal & compliance index

Master checklist for South African regulatory requirements. Last reviewed: **9 July 2026**.

## Public website (live routes)

| Document | URL | Source |
|----------|-----|--------|
| **Legal centre (hub)** | `/legal` | `client/src/pages/legal/LegalHub.tsx` |
| Privacy Policy (POPIA) | `/privacy-policy` | `docs/legal/PRIVACY_POLICY.md` |
| Terms of Service | `/terms` | `docs/legal/TERMS_OF_SERVICE.md` |
| AI Ethics & Transparency | `/ai-ethics` | React page |
| Data Processing Agreement | `/dpa` | `docs/legal/DATA_PROCESSING_AGREEMENT.md` |
| Acceptable Use Policy | `/aup` | `docs/legal/ACCEPTABLE_USE_POLICY.md` |
| Service Level Agreement | `/sla` | `docs/legal/SERVICE_LEVEL_AGREEMENT.md` |
| Credit & Finance Disclaimer | `/credit-disclaimer` | `docs/legal/CREDIT_DISCLAIMER.md` |
| **Dealer Agreement (sign-off)** | `/legal/dealer-agreement` | `docs/legal/DEALER_AGREEMENT.md` |
| **POPIA Consent Form (sign-off)** | `/legal/popia-consent-form` | `docs/legal/POPIA_CONSENT_FORM.md` |
| **POPIA Information Officer guide** | `/legal/popia-information-officer` | `docs/POPIA_INFORMATION_OFFICER.md` |

All linked from site footer and **`/dealer/legal`** in the dealer console.

## Compliance monitoring (live)

| Channel | Implementation |
|---------|----------------|
| Web form | `/legal` → `complianceMailbox.submit` → DB + founder Gmail alert |
| Resend inbound | `/api/webhooks/resend-inbound` for privacy@ / legal@ |
| Admin inbox | `/admin/compliance` |
| Setup guide | `docs/COMPLIANCE_MAILBOX_SETUP.md` |

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
| POPIA modal (customers) | `popiaConsent.ts` | Backend ready; UI modal enabled in `App.tsx` for logged-in users |
| Dealer onboarding | `docs/PILOT_ONBOARDING_CHECKLIST.md` | Signed dealer agreement + POPIA consent form via `/legal` |
| Dealer console legal hub | `/dealer/legal` | All policies + sign-off links for dealership staff |

## Internal / contract templates (source markdown)

| Document | Path | Live URL |
|----------|------|----------|
| Dealer Agreement | `docs/legal/DEALER_AGREEMENT.md` | `/legal/dealer-agreement` |
| POPIA Consent Form | `docs/legal/POPIA_CONSENT_FORM.md` | `/legal/popia-consent-form` |
| Liability & Indemnification | `docs/legal/LIABILITY_INDEMNIFICATION.md` | Incorporated in Terms / Dealer Agreement |

## Key contacts (must be monitored mailboxes)

| Role | Email |
|------|-------|
| General / unsubscribe | hello@grayarx.com |
| Privacy / Information Officer queries | privacy@grayarx.com |
| AI ethics | ethics@grayarx.com |
| Pilot outreach | pilot@grayarx.com |

## Open items (non-blocking for pilot)

- [ ] Formal attorney review of all `docs/legal/*` templates (recommended before scaling)
- [ ] Monitor `privacy@grayarx.com` and `legal@grayarx.com` mailboxes
- [ ] Information Officer registration with the Information Regulator (POPIA)
- [ ] Collect signed Dealer Agreement + POPIA form per pilot dealership (return to legal@grayarx.com)
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
| 9 Jul 2026 | Legal centre `/legal`, dealer hub `/dealer/legal`, sign-off pages for dealer agreement & POPIA form |
