import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";

const emailTemplates = {
  welcome: {
    subject: "Welcome to GrayArx — Your 24/7 AI Sales Team",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%); color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0e27; }
        .header { text-align: center; padding: 40px 20px; }
        .logo { width: 150px; height: auto; margin-bottom: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .content { padding: 30px 20px; background-color: #1a1f3a; border-radius: 8px; margin: 20px; }
        .content h2 { color: #d4af37; margin-top: 0; }
        .content p { line-height: 1.6; color: #ffffff; }
        .content ul { color: #ffffff; padding-left: 20px; }
        .content li { margin: 10px 0; }
        .cta-button { display: inline-block; background-color: #d4af37; color: #0a0e27; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 30px 20px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="GrayArx" class="logo" style="display: inline-block;">
        </div>
        
        <div class="content">
            <h2>Your 24/7 AI Sales Team is Ready</h2>
            <p>Hi there,</p>
            <p>Welcome to GrayArx — The Dealership AI Operating System.</p>
            
            <p><strong>Here's what our autonomous agents do:</strong></p>
            <ul>
                <li><strong>Mia (Email Agent)</strong> — Captures leads 24/7 and sends personalized follow-ups</li>
                <li><strong>Themba (Calling Agent)</strong> — Places outbound calls to prospects and qualifies buyers</li>
                <li><strong>Lerato (Booking Agent)</strong> — Schedules test drives across WhatsApp, email, and web</li>
                <li><strong>Sipho (Prospector)</strong> — Generates qualified dealership leads from your market</li>
                <li><strong>Tumi (Trade-In Agent)</strong> — Provides instant valuations on trade-in vehicles</li>
                <li><strong>Bongi (Fallback Agent)</strong> — Handles after-hours inquiries with professionalism</li>
            </ul>
            
            <p>All agents speak all 11 South African official languages and comply with POPIA.</p>
            
            <p><strong>The result?</strong> Dealerships see 3-5x more leads captured, 40% faster response times, and 25% higher conversion rates.</p>
            
            <p>We're offering a <strong>free 30-day trial</strong> — no credit card required.</p>
            
            <a href="https://www.grayarx.com/onboarding" class="cta-button">Start Free Trial</a>
            
            <p style="margin-top: 30px;">Questions? Reply to this email or call <strong>079 491 5187</strong>.</p>
            
            <p>Best regards,<br><strong>Henrique Marx</strong><br>Founder, GrayArx</p>
        </div>
        
        <div class="footer">
            <p>GrayArx — The Dealership AI Operating System</p>
            <p>📧 grayarx@gmail.com | 📞 079 491 5187</p>
            <p>🌐 www.grayarx.com</p>
        </div>
    </div>
</body>
</html>
    `,
  },
  followup: {
    subject: "Following Up — Your GrayArx Demo",
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background: #0a0e27; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0e27; }
        .header { text-align: center; padding: 40px 20px; }
        .logo { width: 150px; height: auto; margin-bottom: 20px; }
        .content { padding: 30px 20px; background-color: #1a1f3a; border-radius: 8px; margin: 20px; }
        .content h2 { color: #d4af37; margin-top: 0; }
        .content p { line-height: 1.6; color: #ffffff; }
        .cta-button { display: inline-block; background-color: #d4af37; color: #0a0e27; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 30px 20px; font-size: 12px; color: #888; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${LOGO_URL}" alt="GrayArx" class="logo" style="display: inline-block;">
        </div>
        
        <div class="content">
            <h2>Following Up — Let's Schedule Your Demo</h2>
            <p>Hi there,</p>
            <p>I wanted to follow up on our initial conversation about GrayArx.</p>
            <p>Many dealerships are already seeing 3-5x more leads captured with our AI agents running 24/7.</p>
            <p>Would you like to schedule a quick 30-minute demo to see how it works for your dealership?</p>
            
            <a href="https://www.grayarx.com/book-demo" class="cta-button">Book Your Demo</a>
            
            <p style="margin-top: 30px;">Best regards,<br><strong>Henrique Marx</strong><br>Founder, GrayArx</p>
        </div>
        
        <div class="footer">
            <p>GrayArx — The Dealership AI Operating System</p>
            <p>📧 grayarx@gmail.com | 📞 079 491 5187</p>
        </div>
    </div>
</body>
</html>
    `,
  },
};

export default function AdminEmailPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<"welcome" | "followup">("welcome");
  const [recipientEmail, setRecipientEmail] = useState("grayarx@gmail.com");
  const [sending, setSending] = useState(false);

  const template = emailTemplates[selectedTemplate];

  const handleSendTest = async () => {
    setSending(true);
    try {
      // In a real implementation, this would call a tRPC endpoint
      // For now, we'll just show a success message
      console.log("Would send email to:", recipientEmail);
      alert(`✅ Test email would be sent to ${recipientEmail}\n\nNote: Email sending requires backend configuration.`);
    } catch (error) {
      alert("❌ Error sending email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Preview & Testing</h1>
        <p className="text-muted-foreground mt-2">Preview and test email templates with animated logo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selector */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>Select a template to preview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as "welcome" | "followup")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                  <TabsTrigger value="followup">Follow-up</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Test Recipient Email</Label>
              <Input
                id="recipient"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="grayarx@gmail.com"
              />
            </div>

            <Button onClick={handleSendTest} disabled={sending} className="w-full">
              {sending ? "Sending..." : "Send Test Email"}
            </Button>

            <div className="pt-4 border-t space-y-2">
              <p className="text-sm font-semibold">Subject:</p>
              <p className="text-sm text-muted-foreground">{template.subject}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Logo Animation:</p>
              <p className="text-sm text-muted-foreground">✓ Pulsing animation (2s cycle)</p>
            </div>
          </CardContent>
        </Card>

        {/* Email Preview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>This is how the email will appear in inboxes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={template.html}
                style={{
                  width: "100%",
                  height: "600px",
                  border: "none",
                }}
                title="Email Preview"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Animated Logos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <p>
            The GrayArx logo in these emails uses CSS animation (pulsing effect). Most modern email clients support CSS animations, including Gmail, Outlook, and Apple Mail. The animation will display as a pulsing effect (opacity changing from 100% to 70% over 2 seconds).
          </p>
          <p className="mt-2">
            <strong>Note:</strong> Some older email clients may not support animations and will show a static logo instead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
