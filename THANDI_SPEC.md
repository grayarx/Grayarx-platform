# Thandi — The Accountant Agent

## Overview
Thandi is the 7th named agent in GrayArx. She handles all financial document generation: invoices, payment statements, payment reminders, and VAT reconciliation. She operates in all 7 SA languages with POPIA-aware masking of sensitive financial data.

## Core Capabilities

### 1. Invoice Generation
**Input:** Lead/prospect record + vehicle sale details + payment terms
**Output:** Branded PDF invoice with:
- Invoice number (auto-incremented, dealer-specific prefix)
- Dealership name, address, VAT number, bank details
- Vehicle details (make, model, year, VIN, registration)
- Line items (vehicle price, add-ons, discounts, VAT)
- Payment terms (due date, payment methods)
- Dealership logo + accent color (from brand kit)
- Footer with POPIA compliance statement

**POPIA Masking:**
- Never show full customer ID number → show last 4 digits only (e.g., "ID: ****2847")
- Never show full bank account number → show last 4 digits only (e.g., "Account: ****7392")
- Never show full phone number in reminders → show last 4 digits only (e.g., "Call: +27 *** *** 0847")
- Full unmasked data stored in database but never rendered in customer-facing PDFs

### 2. Payment Statements
**Input:** Lead record + payment history
**Output:** Branded PDF statement with:
- Statement period (from–to dates)
- Opening balance, payments received, closing balance
- Payment history table (date, amount, method, reference)
- Outstanding balance (if any)
- Next payment due date
- POPIA-masked customer ID

### 3. Payment Reminders
**Input:** Lead record + overdue payment threshold
**Output:** Email + WhatsApp draft with:
- Friendly reminder tone (language-aware)
- Outstanding amount (unmasked, since it's to the customer)
- Due date
- Payment methods accepted
- Contact info (masked phone: last 4 digits only)
- POPIA footer

**Language-aware tone examples:**
- EN: "Hi [Name], your payment of R 45,000 is due by 15 May. Reply to arrange payment."
- AF: "Hallo [Naam], jou betaling van R 45 000 is verskuldig op 15 Mei. Antwoord om betaling te reël."
- ZU: "Sawubona [Igama], imali yakho ye-R 45 000 ifanele ngomhla ka-15 Meyi. Phendula ukuze ulungisele imali."

### 4. VAT Reconciliation
**Input:** Invoice list + VAT rate (15% in SA)
**Output:** VAT summary with:
- Total invoices issued
- Total VAT collected
- VAT due date (monthly/quarterly per dealership setting)
- Auto-toggle: if VAT due > R 50k, flag as "high VAT liability"

## Database Schema

```sql
CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dealershipId INT NOT NULL,
  leadId INT NOT NULL,
  invoiceNumber VARCHAR(50) UNIQUE NOT NULL,
  invoiceDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dueDate DATE NOT NULL,
  vehicleId INT NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  vatAmount DECIMAL(10, 2) NOT NULL,
  totalAmount DECIMAL(10, 2) NOT NULL,
  status ENUM('draft', 'sent', 'paid', 'overdue') DEFAULT 'draft',
  pdfUrl VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dealershipId) REFERENCES dealerships(id),
  FOREIGN KEY (leadId) REFERENCES leads(id),
  FOREIGN KEY (vehicleId) REFERENCES vehicles(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paymentDate DATE NOT NULL,
  paymentMethod ENUM('bank_transfer', 'card', 'cash', 'cheque') NOT NULL,
  reference VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoiceId) REFERENCES invoices(id)
);

CREATE TABLE vatReconciliation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dealershipId INT NOT NULL,
  periodStart DATE NOT NULL,
  periodEnd DATE NOT NULL,
  totalInvoices INT NOT NULL,
  totalVatCollected DECIMAL(10, 2) NOT NULL,
  vatDueDate DATE NOT NULL,
  status ENUM('pending', 'submitted', 'paid') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dealershipId) REFERENCES dealerships(id)
);
```

## tRPC Procedures

### thandi.generateInvoice
**Input:** `{ leadId, vehicleId, paymentTermsDays }`
**Output:** `{ invoiceId, pdfUrl, invoiceNumber, totalAmount }`

### thandi.listInvoices
**Input:** `{ dealershipId, status?, limit }`
**Output:** `Invoice[]`

### thandi.getStatement
**Input:** `{ leadId, periodStart, periodEnd }`
**Output:** `{ statement, pdfUrl }`

### thandi.sendReminder
**Input:** `{ invoiceId, channel: 'email' | 'whatsapp' }`
**Output:** `{ success, sentAt, draftId }`

### thandi.getVatReconciliation
**Input:** `{ dealershipId, periodStart, periodEnd }`
**Output:** `{ totalVat, invoiceCount, vatDue, flagged }`

## LLM Prompts

### Invoice Draft
```
You are Thandi, GrayArx's Accountant Agent. Generate a professional invoice.

Customer: {customerName}
Vehicle: {vehicleYear} {vehicleMake} {vehicleModel}
Amount: R {amount}
VAT (15%): R {vat}
Total: R {total}
Due Date: {dueDate}

Generate a concise invoice summary (for PDF rendering). Include:
- Line items (vehicle, add-ons, discounts)
- Subtotal, VAT, total
- Payment terms
- Professional tone

Respond in {language}.
```

### Payment Reminder
```
You are Thandi, GrayArx's Accountant Agent. Draft a friendly payment reminder.

Customer: {customerName}
Outstanding: R {amount}
Due Date: {dueDate}
Contact: {dealershipPhone}

Draft a short, friendly reminder (max 2 sentences). Tone should be warm and helpful.
Include payment methods and contact info.

Respond in {language}.
```

## POPIA Compliance Checklist

- [ ] Never log full ID numbers (mask to last 4 digits)
- [ ] Never log full bank account numbers (mask to last 4 digits)
- [ ] Never log full phone numbers in customer-facing docs (mask to last 4 digits)
- [ ] All unmasked data stored in database with access logs
- [ ] Invoice PDFs include POPIA footer: "This invoice contains personal information. Treat confidentially."
- [ ] Statements include POPIA footer
- [ ] Reminders mask contact info to last 4 digits only
- [ ] VAT reconciliation does not include customer PII

## Implementation Priority

1. **Phase A.2.1** — Database schema + migrations
2. **Phase A.2.2** — tRPC procedures (generateInvoice, listInvoices, getStatement)
3. **Phase A.2.3** — LLM prompts + invoice PDF rendering
4. **Phase A.2.4** — Payment reminders (email + WhatsApp)
5. **Phase A.2.5** — VAT reconciliation
6. **Phase A.2.6** — Vitest coverage (schema, masking, LLM calls)

## Estimated Effort

- Schema + migrations: 30 mins
- tRPC procedures: 1 hour
- LLM prompts + PDF: 1.5 hours
- Reminders + VAT: 1 hour
- Vitest: 45 mins
- **Total: ~4.5 hours (implementation mode, ~200 credits)**
