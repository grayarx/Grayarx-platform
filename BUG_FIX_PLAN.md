# GrayArx Critical Bug Fix Plan

## Overview
12 critical bugs blocking production. Estimated fix time: 2-3 hours with comprehensive testing.

## Bug Priority & Implementation Order

### PHASE 1: Trade-In & Vehicle Selection (30 min)
**Bug:** Vehicle dropdown not showing + Trade-in valuation too low
- Issue: Trade-in form uses text input for "Make" instead of dropdown
- Issue: Valuation algorithm undervalues cars (Polo showing R9,568-R11,232 vs realistic R98k)
- Fix: Replace text input with proper dropdown (Make → Model → Year)
- Fix: Implement realistic valuation based on condition + mileage + market data
- Test: Unit tests for valuation algorithm with edge cases

### PHASE 2: Pre-Approval & Finance (30 min)
**Bug:** Pre-approval form not working + Finance calculator page stuck
- Issue: "Submit application" button does nothing (no onClick handler)
- Issue: Finance calculator has no back button or navigation
- Fix: Wire pre-approval form submission to tRPC endpoint
- Fix: Add back button and proper navigation
- Test: E2E tests for form submission flow

### PHASE 3: Authentication & Branding (45 min)
**Bug:** Only Manus OAuth + Manus branding visible
- Issue: No Google, Email, Phone, Username login options
- Issue: "Powered by Manus" visible on login page
- Fix: Implement multi-auth provider (Google OAuth, Email/Password, Phone OTP, Username)
- Fix: Remove all Manus branding and logos
- Test: Auth flow tests for each provider

### PHASE 4: Showroom Email Workflow (30 min)
**Bug:** Client must email instead of auto-email
- Issue: "Enquire" button on showroom doesn't trigger email
- Issue: No dealership branding in email
- Fix: Wire "Enquire" button to send branded email to dealership
- Fix: Include vehicle details in email
- Test: Email template tests with dealership branding

### PHASE 5: WhatsApp Agent on Showroom (30 min)
**Bug:** No WhatsApp agent on vehicle page
- Issue: Nala not available for live enquiries
- Issue: No vehicle details passed to agent
- Fix: Add WhatsApp chat widget on showroom vehicle page
- Fix: Wire vehicle details to Nala agent context
- Test: Agent context tests with vehicle data

### PHASE 6: Vehicle Photos (20 min)
**Bug:** All vehicles show "No photo yet"
- Issue: Photo upload not working
- Issue: Photos not displaying
- Fix: Implement photo upload to storage
- Fix: Display photos in inventory and showroom
- Test: Photo upload and display tests

### PHASE 7: Paste Functionality (15 min)
**Bug:** Can't paste CSV or text
- Issue: Paste event not handled
- Issue: CSV import textarea broken
- Fix: Add paste event listener
- Fix: Handle clipboard data
- Test: Paste functionality tests

### PHASE 8: Start Free Trial Button (10 min)
**Bug:** Start Free Trial button doesn't work
- Issue: Button redirects but doesn't start trial
- Issue: No trial account creation
- Fix: Wire button to create trial account
- Fix: Redirect to dashboard after creation
- Test: Trial creation flow tests

### PHASE 9: Kagiso Continuous Updates (45 min)
**Bug:** Kagiso not continuously updating inventory
- Issue: No scheduled updates from Cars.co.za/AutoTrader
- Issue: Manual import only
- Fix: Implement scheduled import job (daily/hourly)
- Fix: Add Cars.co.za/AutoTrader API integration
- Test: Scheduled job tests with mock data

## Implementation Strategy

1. **Fix in order of impact**: Trade-in → Pre-approval → Auth → Email → WhatsApp → Photos → Paste → Trial → Kagiso
2. **Test each fix**: Unit tests + integration tests + manual testing
3. **Batch related fixes**: Group UI fixes together, group backend fixes together
4. **Deploy incrementally**: Checkpoint after every 2-3 fixes
5. **Load test after each phase**: Ensure no performance regression

## Success Criteria

- [ ] All 12 bugs fixed
- [ ] 100% test pass rate
- [ ] <500ms P95 latency maintained
- [ ] No TypeScript errors
- [ ] All features tested in production environment

## Timeline

- Phase 1: 30 min
- Phase 2: 30 min
- Phase 3: 45 min
- Phase 4: 30 min
- Phase 5: 30 min
- Phase 6: 20 min
- Phase 7: 15 min
- Phase 8: 10 min
- Phase 9: 45 min
- Testing & Deployment: 30 min

**Total: 3 hours 45 minutes**
