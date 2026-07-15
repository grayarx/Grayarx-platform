# GrayArx Service Level Agreement (SLA)

**Effective Date:** 1 June 2026  
**Last Updated:** 15 July 2026

> **Pilot note:** During founder-led pilot, use the honest response targets in [`docs/PILOT_SLA.md`](../PILOT_SLA.md). The sections below remain the long-form commercial SLA; pilot partners should treat critical/high response times in the pilot summary as the operable commitment until a dedicated support desk is staffed.

---

## 1. Purpose & Scope

This Service Level Agreement ("**SLA**") defines the service levels, support commitments, and remedies for the GrayArx platform. This SLA applies to all paid subscription tiers and is incorporated into the Terms of Service.

---

## 2. Definitions

- **"Uptime"** means the percentage of time the Service is available and operational (calculated monthly)
- **"Downtime"** means any period when the Service is not available due to GrayArx's actions or inactions
- **"Scheduled Maintenance"** means planned maintenance windows announced in advance
- **"Unscheduled Maintenance"** means emergency maintenance required to address security or critical issues
- **"Critical Issue"** means the Service is completely unavailable or core functionality is broken
- **"High Priority Issue"** means a feature is broken or severely degraded
- **"Medium Priority Issue"** means performance is degraded or non-critical features are affected
- **"Low Priority Issue"** means questions, feature requests, or minor bugs

---

## 3. Uptime Commitment

### 3.1 Uptime Target
GrayArx commits to **99.5% uptime** measured on a monthly basis. This means:
- Maximum allowed downtime per month: **3.6 hours** (or approximately 10.8 minutes per day)
- Uptime is calculated as: (Total minutes in month – Downtime minutes) / Total minutes in month × 100

### 3.2 Uptime Exclusions
Downtime does NOT include:
- **Scheduled Maintenance:** Announced maintenance windows (see Section 4)
- **Customer Responsibility:** Issues caused by Customer's actions (misconfiguration, data corruption, etc.)
- **Third-Party Services:** Outages of third-party services (Stripe, AWS, Twilio, etc.)
- **Force Majeure:** Natural disasters, war, terrorism, government action, etc.
- **DDoS Attacks:** Distributed denial-of-service attacks (unless caused by GrayArx's negligence)
- **Network Issues:** Internet connectivity issues outside GrayArx's control

### 3.3 Uptime Monitoring
GrayArx monitors uptime using:
- **Automated Monitoring:** Real-time monitoring of all platform components
- **Synthetic Monitoring:** Simulated user transactions every minute
- **Third-Party Monitoring:** Independent uptime monitoring service
- **Uptime Dashboard:** Public dashboard at status.grayarx.com

---

## 4. Scheduled Maintenance

### 4.1 Maintenance Windows
GrayArx performs scheduled maintenance on:
- **Day:** Second Sunday of each month
- **Time:** 02:00–04:00 SAST (South African Standard Time)
- **Duration:** Maximum 2 hours

### 4.2 Maintenance Notification
GrayArx will provide:
- **7 days' advance notice:** Posted on status.grayarx.com and sent via email
- **24 hours before:** Reminder notification
- **1 hour before:** Final notification
- **During maintenance:** Real-time updates on status.grayarx.com

### 4.3 Emergency Maintenance
GrayArx may perform emergency maintenance without notice if:
- A critical security vulnerability is discovered
- The Service is experiencing a critical outage
- Data integrity is at risk

GrayArx will provide notification as soon as practicable (within 1 hour of discovery).

---

## 5. Support Commitments

### 5.1 Support Channels
GrayArx provides support via:
- **Email:** support@grayarx.com
- **Phone:** +27 79 491 5187
- **Chat:** In-app support chat (business hours)
- **Ticketing System:** Automated ticket tracking

### 5.2 Support Hours
- **Critical Issues:** 24/7 (including weekends and public holidays)
- **High Priority:** Monday–Friday, 08:00–18:00 SAST
- **Medium & Low Priority:** Monday–Friday, 08:00–18:00 SAST

### 5.3 Response Time Commitments

| Priority Level | Response Time | Resolution Target |
|---|---|---|
| **Critical** | 1 hour | 4 hours |
| **High** | 4 hours | 24 hours |
| **Medium** | 24 hours | 5 business days |
| **Low** | 48 hours | 10 business days |

**Note:** Response time is the time from ticket submission to first response. Resolution target is the time to fully resolve the issue.

### 5.4 Escalation
If an issue is not resolved within the target timeframe:
- **Tier 1 Support** escalates to **Tier 2 (Engineering)**
- **Tier 2** escalates to **Tier 3 (Senior Engineering)**
- **Tier 3** escalates to **CTO** (for critical issues)

---

## 6. Service Credits

### 6.1 Credit Eligibility
If GrayArx fails to meet the 99.5% uptime commitment, the Customer is entitled to service credits:

| Monthly Uptime | Service Credit |
|---|---|
| 99.0–99.5% | 5% of monthly fee |
| 98.0–99.0% | 10% of monthly fee |
| 95.0–98.0% | 25% of monthly fee |
| Below 95.0% | 50% of monthly fee |

### 6.2 Credit Request Process
To claim service credits:
1. Submit a request to support@grayarx.com within 30 days of the outage
2. Include the date, time, and duration of the outage
3. Include the impact on your business (optional)

GrayArx will verify the outage and issue a credit within 10 business days.

### 6.3 Credit Application
Credits are applied as:
- Account credit (applied to next month's invoice)
- Refund (if account is terminated)

Credits are non-transferable and expire 12 months after issuance.

### 6.4 Credit Limitations
- Credits are the Customer's sole remedy for service failures
- Credits do not apply to issues caused by Customer actions or third-party services
- Credits do not apply during Scheduled Maintenance or force majeure events
- Total credits in any 12-month period shall not exceed 50% of annual fees

---

## 7. Performance Standards

### 7.1 Response Time
- **Page Load Time:** Average <2 seconds (95th percentile <5 seconds)
- **API Response Time:** Average <500ms (95th percentile <1 second)
- **Report Generation:** <30 seconds for standard reports

### 7.2 Availability of Features
- **Inventory Management:** 99.5% uptime
- **Lead Capture:** 99.5% uptime
- **Agent Communications:** 99.5% uptime
- **Dashboard & Reporting:** 99.0% uptime (lower priority)

### 7.3 Data Processing
- **Email Drafts:** Generated within 5 minutes of lead submission
- **WhatsApp Responses:** Generated within 10 minutes of message receipt
- **Trade-In Valuations:** Generated within 30 seconds of submission
- **Report Generation:** Completed within 24 hours of request

---

## 8. Backup & Disaster Recovery

### 8.1 Backup Policy
GrayArx maintains:
- **Daily backups:** Automated daily backups of all customer data
- **Backup retention:** 30 days of backup history
- **Backup testing:** Monthly restoration tests to verify backup integrity
- **Backup location:** Geographically distributed (South Africa + EU)

### 8.2 Recovery Time Objective (RTO)
GrayArx commits to:
- **Critical data loss:** Recovery within 4 hours
- **Partial data loss:** Recovery within 24 hours
- **Service restoration:** Recovery within 1 hour of backup restoration

### 8.3 Recovery Point Objective (RPO)
GrayArx commits to:
- **Maximum data loss:** 1 hour of transactions
- **Backup frequency:** Hourly incremental backups

---

## 9. Security & Compliance

### 9.1 Security Standards
GrayArx maintains:
- **Encryption:** TLS 1.2+ for data in transit, AES-256 for data at rest
- **Access Control:** Role-based access, multi-factor authentication
- **Firewalls:** Network perimeter protection, intrusion detection
- **Vulnerability Management:** Regular security audits and penetration testing
- **Incident Response:** 24/7 security monitoring and incident response

### 9.2 Compliance Standards
GrayArx complies with:
- **POPIA:** Protection of Personal Information Act, 2013
- **NCA:** National Credit Act, 2005
- **CPA:** Consumer Protection Act, 2008
- **ECTA:** Electronic Communications and Transactions Act, 2002
- **GDPR:** General Data Protection Regulation (for EU data subjects)

### 9.3 Compliance Audits
GrayArx undergoes:
- **Annual security audit:** Third-party security assessment
- **Annual compliance review:** POPIA and NCA compliance verification
- **Quarterly vulnerability scans:** Automated vulnerability scanning
- **Monthly penetration testing:** Simulated attacks to identify weaknesses

---

## 10. Limitations & Disclaimers

### 10.1 Service Limitations
- **Best Effort:** GrayArx provides services on a "best effort" basis
- **No Guarantee:** We do not guarantee error-free or uninterrupted service
- **Third-Party Services:** We are not liable for third-party service failures

### 10.2 Exclusions
This SLA does NOT apply to:
- **Free trial accounts:** Trial accounts are not covered by this SLA
- **Suspended accounts:** Accounts suspended for Terms of Service violations
- **Custom integrations:** Custom API integrations or third-party plugins
- **Customer misuse:** Issues caused by Customer's actions

### 10.3 Liability Cap
GrayArx's total liability for SLA violations is limited to service credits as described in Section 6. This is the Customer's sole remedy for service failures.

---

## 11. Changes to This SLA

GrayArx may update this SLA at any time by posting the revised version on its website. Material changes will be communicated with 30 days' notice. The Customer's continued use of the Service constitutes acceptance of the updated SLA.

---

## 12. Contact Information

For questions about this SLA or to report service issues, contact:

**GrayArx Support Team**  
Email: support@grayarx.com  
Phone: +27 79 491 5187  
Status Page: status.grayarx.com

---

**END OF SERVICE LEVEL AGREEMENT**
