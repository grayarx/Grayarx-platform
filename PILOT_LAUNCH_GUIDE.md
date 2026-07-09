# GrayArx Pilot Launch Guide

**Version:** Phase 33 (feaca76f)  
**Date:** June 1, 2026  
**Status:** Ready for Pilot Launch

---

## Executive Summary

GrayArx is production-ready for pilot launch with 5 dealerships. This guide covers deployment, onboarding, monitoring, and incident response procedures.

**Key Milestones:**
- ✅ All 5 critical features implemented (Email Notifications, Audit Logging, Lead Quality Scoring, Performance Analytics, Bulk Lead Import)
- ✅ Database migrations applied (7 new tables)
- ✅ tRPC API fully integrated
- ✅ Comprehensive test suite created
- ✅ Dev server running cleanly (0 TypeScript errors)

---

## Pre-Launch Checklist

### Database & Infrastructure
- [x] All 7 Phase 33 tables created and migrated
- [x] Foreign key relationships verified
- [x] Database backups configured
- [x] Connection pooling optimized
- [x] Query performance baseline established

### Backend Services
- [x] Email Notification Service (Resend API integration)
- [x] Audit Logger (activity tracking)
- [x] Lead Quality Scorer (10-factor analysis)
- [x] Performance Metrics (KPI calculations)
- [x] Bulk Lead Importer (CSV processing)

### API & tRPC
- [x] All 5 feature routers integrated
- [x] Type safety verified (TypeScript clean)
- [x] Error handling implemented
- [x] Rate limiting configured
- [x] CORS policies set

### Testing
- [x] Unit test suite created (phase33.test.ts)
- [x] Edge case coverage implemented
- [x] Error scenarios tested
- [x] Data validation verified
- [x] Integration tests passing

### Security & Compliance
- [x] POPIA compliance verified
- [x] Data encryption enabled
- [x] API authentication required
- [x] Audit logging enabled
- [x] Rate limiting active

### Documentation
- [x] API endpoint documentation
- [x] Database schema documented
- [x] Error codes documented
- [x] Configuration guide created
- [x] Troubleshooting guide prepared

---

## Pilot Dealership Onboarding

### Phase 1: Dealership Setup (Day 1)

**For Each Pilot Dealership:**

1. **Create Dealership Account**
   ```
   - Dealership name
   - Contact person (owner/manager)
   - Email address
   - Phone number
   - Physical address
   - Monthly lead volume estimate
   - Preferred languages (SA official languages supported)
   ```

2. **Configure Notification Preferences**
   ```
   - Enable/disable notification types:
     * New lead notifications
     * Lead status change alerts
     * Booking request notifications
     * Pre-approval submission alerts
   - Set quiet hours (e.g., 18:00-08:00)
   - Timezone (default: Africa/Johannesburg)
   - Notification frequency (immediate/daily/weekly)
   ```

3. **API Key Generation**
   ```
   - Generate unique API key for dealership
   - Provide webhook URL for integrations
   - Document rate limits (100 requests/minute)
   ```

4. **Initial Data Import**
   ```
   - Import historical leads (CSV format)
   - Import vehicle inventory
   - Calibrate lead quality scoring
   - Establish performance baseline
   ```

### Phase 2: Feature Onboarding (Days 2-3)

**1. Email Notification System**
- Test new lead email notifications
- Verify quiet hours functionality
- Confirm delivery to dealership email
- Set up email forwarding if needed

**2. Audit Logging**
- Review audit log entries
- Verify all actions are tracked
- Test CSV export functionality
- Confirm compliance with POPIA

**3. Lead Quality Scoring**
- Review quality scores for existing leads
- Understand 10-factor scoring breakdown
- Identify top strengths/weaknesses
- Discuss improvement opportunities

**4. Performance Analytics**
- Review daily KPI dashboard
- Understand conversion rate calculations
- Review ROI metrics
- Set performance targets

**5. Bulk Lead Import**
- Test CSV import with sample data
- Verify error handling
- Review import history
- Test retry mechanism for failed imports

### Phase 3: Training & Support (Day 4)

**Dealership Team Training:**
- Dashboard navigation
- Lead management workflow
- Reporting & analytics
- Troubleshooting common issues
- Support contact procedures

**Documentation Provided:**
- Quick start guide
- API documentation
- Troubleshooting guide
- FAQ document
- Contact information

---

## Monitoring & Alerting Strategy

### Real-Time Monitoring

**Server Health Checks (Every 5 minutes)**
```
- API response time (target: <500ms)
- Database connection pool status
- Error rate (target: <0.1%)
- Memory usage (target: <70%)
- CPU usage (target: <60%)
```

**Feature-Specific Metrics**
```
- Email notifications: delivery rate (target: >99%)
- Audit logs: write latency (target: <100ms)
- Lead quality scoring: calculation time (target: <500ms)
- Performance analytics: aggregation time (target: <2s)
- Bulk imports: processing rate (target: >100 leads/sec)
```

### Alert Thresholds

**Critical Alerts (Immediate Action Required)**
- API response time > 2 seconds
- Error rate > 1%
- Database connection pool exhausted
- Memory usage > 90%
- Email delivery rate < 95%

**Warning Alerts (Monitor & Investigate)**
- API response time > 1 second
- Error rate > 0.5%
- Memory usage > 80%
- Slow database queries (>5s)
- Import processing rate < 50 leads/sec

### Logging & Debugging

**Log Locations:**
```
- Server logs: .manus-logs/devserver.log
- Browser console: .manus-logs/browserConsole.log
- Network requests: .manus-logs/networkRequests.log
- Session replay: .manus-logs/sessionReplay.log
```

**Log Retention:**
- Logs auto-trim when exceeding 1MB
- Keeps newest 60% of logs
- Daily archive to backup storage
- 30-day retention policy

---

## Incident Response Plan

### Severity Levels

**Critical (P1) - Immediate Response**
- Platform down or unreachable
- Data loss or corruption
- Security breach detected
- All dealerships affected

**High (P2) - Urgent Response (1 hour)**
- Feature not working for dealership
- Performance degradation (>50%)
- Email delivery failure
- Data inconsistency

**Medium (P3) - Standard Response (4 hours)**
- Minor feature issue
- Performance degradation (10-50%)
- Single dealership affected
- Workaround available

**Low (P4) - Routine Response (1 day)**
- Cosmetic issues
- Documentation updates
- Enhancement requests
- Non-critical bugs

### Response Procedures

**Step 1: Assess Impact**
```
- Identify affected dealerships
- Determine feature/service impacted
- Estimate time to resolution
- Notify stakeholders
```

**Step 2: Investigate Root Cause**
```
- Check server logs
- Review recent deployments
- Check database status
- Review error patterns
```

**Step 3: Implement Fix**
```
- For quick fixes: patch and deploy
- For complex issues: rollback to previous checkpoint
- For data issues: restore from backup
- For security issues: isolate affected systems
```

**Step 4: Verify Resolution**
```
- Test affected feature
- Monitor for regression
- Confirm dealership access
- Document incident
```

**Step 5: Post-Incident Review**
```
- Root cause analysis
- Prevention measures
- Documentation updates
- Team debriefing
```

### Rollback Procedure

**If Critical Issue Detected:**

1. **Identify Last Good Checkpoint**
   ```
   Version: feaca76f (Phase 33 - Critical Pre-Pilot Features)
   ```

2. **Execute Rollback**
   ```
   - Stop current deployment
   - Restore from checkpoint
   - Verify database integrity
   - Restart services
   - Run health checks
   ```

3. **Notify Dealerships**
   ```
   - Brief outage notification
   - Expected restoration time
   - Incident reference number
   - Follow-up communication
   ```

---

## Success Metrics & KPIs

### Pilot Success Criteria

**Technical Metrics**
- API uptime: ≥99.5%
- Average response time: <500ms
- Error rate: <0.1%
- Email delivery rate: >99%
- Data accuracy: 100%

**Business Metrics**
- Dealership adoption rate: ≥80%
- Feature usage rate: ≥70%
- Lead quality improvement: ≥15%
- Customer satisfaction: ≥4.5/5.0
- Support ticket resolution: <24 hours

**Feature-Specific Metrics**

**Email Notifications**
- Delivery rate: >99%
- Open rate: >40%
- Click rate: >15%
- Bounce rate: <1%

**Audit Logging**
- Log write latency: <100ms
- Query response time: <1s
- CSV export time: <5s
- Data completeness: 100%

**Lead Quality Scoring**
- Calculation accuracy: >95%
- Factor distribution: balanced across 10 factors
- Score correlation with conversion: >0.7
- User satisfaction: >4/5

**Performance Analytics**
- KPI calculation accuracy: >99%
- Dashboard load time: <2s
- Report generation time: <10s
- Data freshness: <5 minutes

**Bulk Lead Import**
- Processing speed: >100 leads/sec
- Error detection rate: >99%
- Deduplication accuracy: >99%
- Retry success rate: >90%

---

## Communication Plan

### Stakeholder Updates

**Daily (During Pilot Week)**
- Morning: Status summary (all systems operational)
- Evening: Daily metrics and any issues encountered

**Weekly (After Pilot Week)**
- Monday: Weekly performance report
- Friday: Week summary and upcoming priorities

**Critical Issues**
- Immediate notification to all stakeholders
- Hourly updates until resolved
- Post-incident summary within 24 hours

### Dealership Communication

**Onboarding**
- Welcome email with quick start guide
- Scheduled training call
- Follow-up support check-in

**Weekly**
- Performance summary email
- Feature tips and best practices
- Upcoming enhancements

**As Needed**
- Issue notifications
- Maintenance windows
- Security updates

---

## Deployment Checklist

### Pre-Deployment (24 hours before)
- [ ] All tests passing
- [ ] Database backups created
- [ ] Monitoring systems armed
- [ ] Support team briefed
- [ ] Rollback plan reviewed
- [ ] Dealership communication ready

### Deployment Day
- [ ] Backup current state
- [ ] Deploy to production
- [ ] Run health checks
- [ ] Verify all features
- [ ] Monitor error rates
- [ ] Notify dealerships
- [ ] Document deployment

### Post-Deployment (24 hours after)
- [ ] Monitor metrics closely
- [ ] Respond to dealership feedback
- [ ] Document any issues
- [ ] Celebrate successful launch! 🎉

---

## Support & Escalation

### Support Channels
- Email: support@grayarx.com
- Phone: +27 (0)79 491 5187
- WhatsApp: +27 (0)79 491 5187
- Portal: https://support.grayarx.com

### Escalation Path
1. **Level 1:** Dealership support team (response: <1 hour)
2. **Level 2:** Technical support team (response: <30 minutes)
3. **Level 3:** Engineering team (response: <15 minutes)
4. **Level 4:** Founder/CTO (response: <5 minutes for critical issues)

---

## Next Steps

1. **Confirm Pilot Dealerships** (5 dealerships identified)
2. **Schedule Onboarding Calls** (Days 1-4)
3. **Prepare Training Materials** (Documentation ready)
4. **Set Up Monitoring Dashboard** (Real-time metrics)
5. **Brief Support Team** (Procedures documented)
6. **Execute Pilot Launch** (Go live!)

---

## Appendix: Technical Reference

### Database Schema Summary
- `email_notifications` — Email delivery tracking
- `notification_preferences` — Per-dealership settings
- `dealership_audit_logs` — Activity tracking
- `lead_quality_factors` — 10-factor scoring
- `performance_metrics` — Daily KPIs
- `lead_imports` — Bulk import tracking
- `lead_import_errors` — Import error details

### API Endpoints Summary
- `notifications.*` — Email notification management
- `auditLog.*` — Audit log queries & export
- `leadQuality.*` — Lead scoring & insights
- `performance.*` — KPI calculations & summaries
- `leadImport.*` — CSV import & history

### Configuration Reference
- Email service: Resend API
- Database: MySQL/TiDB
- Authentication: Manus OAuth
- Monitoring: Built-in health checks
- Logging: .manus-logs directory

---

**Document Version:** 1.0  
**Last Updated:** June 1, 2026  
**Next Review:** June 15, 2026  
**Status:** READY FOR PILOT LAUNCH ✅
