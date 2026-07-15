import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface POPIAConsentModalProps {
  open: boolean;
  onClose: () => void;
  onSign: (signedName: string) => Promise<void>;
  isLoading?: boolean;
}

const POPIA_FORM_TEXT = `
GrayArx POPIA Consent & Acknowledgment Form

Effective Date: 1 June 2026

INTRODUCTION
This POPIA Consent & Acknowledgment Form sets out your explicit consent and acknowledgment regarding the processing of personal information in accordance with the Protection of Personal Information Act, 2013 (POPIA).

By signing this Form, you confirm that you understand your obligations under POPIA and agree to comply with all POPIA requirements when using the GrayArx platform.

RESPONSIBLE PARTY STATUS
You acknowledge that you are the "Responsible Party" under POPIA, meaning you:
- Determine the purpose and means of processing personal information
- Bear full responsibility for POPIA compliance
- Are liable for any POPIA violations

GrayArx acts as a "Processor" on your behalf and processes personal information only as instructed.

LAWFUL BASIS FOR PROCESSING
You confirm that all personal information processed through the GrayArx platform is collected and processed on one or more of the following lawful bases:
- Consent: You have obtained explicit, informed consent from the data subject
- Contract: The information is necessary to perform a contract with the data subject
- Legal Obligation: You are required by law to collect and process the information
- Legitimate Interest: You have a legitimate business interest in processing the information

CONSENT REQUIREMENT
You acknowledge that:
- Explicit consent is required before collecting sensitive personal information
- Consent must be freely given, specific, informed, and unambiguous
- Consent cannot be a condition of receiving a service (except where necessary)
- Consent must be documented and retained for audit purposes

PURPOSE LIMITATION
You confirm that personal information will be processed only for the purposes disclosed to the data subject, including:
- Lead capture and customer relationship management
- Vehicle inventory and sales
- Customer communication and follow-up
- Finance and credit assessment
- Service and warranty management
- Regulatory compliance and reporting

DATA SUBJECT RIGHTS
You acknowledge that data subjects have the right to:
- Request access to their personal information (15 business days)
- Request correction of inaccurate information (15 business days)
- Request deletion of their personal information (15 business days)
- Object to processing or opt-out of marketing (48 hours)
- Request their information in portable format (15 business days)
- Lodge a complaint with the Information Regulator

DATA SECURITY & PROTECTION
You acknowledge that GrayArx implements appropriate security measures, including:
- Encryption (TLS 1.2+ in transit, AES-256 at rest)
- Access control and multi-factor authentication
- Firewalls and network perimeter protection
- Real-time threat detection and monitoring
- Daily automated backups

You commit to:
- Protecting your login credentials
- Reporting breaches immediately
- Ensuring only authorized personnel access the Service
- Securely deleting data when no longer needed

THIRD-PARTY DATA SHARING
You acknowledge that GrayArx shares personal information with the following sub-processors:
- Amazon Web Services (AWS) — Cloud hosting and data storage
- Stripe — Payment processing
- Twilio — SMS delivery
- Resend — Email delivery
- Google Analytics — Analytics and usage tracking
- GrayArx AI Services — LLM & AI infrastructure

All sub-processors are bound by confidentiality agreements and process data only as instructed.

DATA RETENTION & DELETION
You acknowledge the following retention periods:
- Customer leads: Duration of subscription + 12 months
- Communications: Duration of subscription + 6 months
- Payment records: 7 years (tax compliance)
- Server logs: 90 days
- Trade-in valuations: Duration of subscription + 12 months

Upon account termination, all personal information will be deleted within 30 days.

COMPLIANCE OBLIGATIONS
You commit to:
- Complying with all POPIA requirements
- Maintaining records of processing activities
- Conducting privacy impact assessments for high-risk processing
- Implementing privacy by design principles
- Training employees on POPIA compliance
- Complying with the National Credit Act (NCA)
- Complying with the Consumer Protection Act (CPA)
- Complying with the Electronic Communications and Transactions Act (ECTA)

LIABILITY & INDEMNIFICATION
You acknowledge that you are solely liable for POPIA compliance and agree to indemnify GrayArx for any claims arising from:
- Your violation of POPIA
- Your violation of other applicable laws
- Your processing of personal information
- Your failure to obtain consent
- Your failure to honor data subject rights

ANNUAL RE-CONFIRMATION
This Form must be re-confirmed annually to ensure continued compliance with POPIA. GrayArx will send a re-confirmation request on the anniversary date of the initial signature.

For full details, visit: www.grayarx.com/legal/popia-consent-form
`;

export function POPIAConsentModal({
  open,
  onClose,
  onSign,
  isLoading = false,
}: POPIAConsentModalProps) {
  const [signedName, setSignedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSign = async () => {
    if (!signedName.trim() || !agreed) return;

    setSubmitting(true);
    try {
      await onSign(signedName);
      setSignedName('');
      setAgreed(false);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = signedName.trim().length >= 2 && agreed;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Only dismiss when the dialog is closing (X / overlay). Opening is controlled by parent.
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-3 bg-[#0c0c10] border-primary/25 text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">POPIA Consent & Acknowledgment</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Scroll the form, then sign below — required before dealers operate on GrayArx.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-100">
            Please complete your POPIA acknowledgment. Required for dealers operating on the platform.
          </AlertDescription>
        </Alert>

        <ScrollArea className="min-h-[180px] max-h-[38vh] border border-white/10 rounded-md p-4 bg-black/40">
          <div className="pr-4 text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {POPIA_FORM_TEXT}
          </div>
        </ScrollArea>

        <div className="space-y-3 shrink-0 border-t border-white/10 pt-3">
          <Input
            placeholder="Enter your full name (e-signature)"
            value={signedName}
            onChange={(e) => setSignedName(e.target.value)}
            disabled={submitting || isLoading}
            className="bg-black/40 border-white/15"
            autoComplete="name"
          />

          <div className="flex items-start gap-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              disabled={submitting || isLoading}
              className="mt-0.5"
            />
            <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer leading-snug">
              I have read and agree to the POPIA Consent & Acknowledgment Form and understand my
              obligations under POPIA.
            </label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={submitting || isLoading}
              className="border-white/20"
            >
              Remind me later
            </Button>
            <Button
              onClick={handleSign}
              disabled={!isValid || submitting || isLoading}
              className="btn-gold"
            >
              {submitting || isLoading ? 'Signing...' : 'Sign & Agree'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
