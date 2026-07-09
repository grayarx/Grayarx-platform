/**
 * Pilot Email Template for GrayArx
 * Customer-focused, no pricing, scarcity-driven
 */

export function generatePilotEmailHTML(dealershipName: string, contactName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GrayArx - Your Dealership's AI Operating System</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #d4af37;
            padding: 40px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
        }
        .greeting strong {
            color: #d4af37;
        }
        .main-message {
            background-color: #f5f5f5;
            border-left: 4px solid #d4af37;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .main-message h2 {
            margin-top: 0;
            color: #1a1a2e;
            font-size: 20px;
        }
        .features {
            margin: 30px 0;
        }
        .features h3 {
            color: #1a1a2e;
            font-size: 16px;
            margin-bottom: 15px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .feature-list li {
            padding: 10px 0;
            padding-left: 25px;
            position: relative;
            color: #555;
        }
        .feature-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #d4af37;
            font-weight: bold;
            font-size: 18px;
        }
        .scarcity-box {
            background-color: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .scarcity-box h3 {
            margin-top: 0;
            color: #856404;
            font-size: 18px;
        }
        .scarcity-box p {
            margin: 10px 0;
            color: #856404;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            background-color: #d4af37;
            color: #1a1a2e;
            padding: 14px 40px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
            margin: 25px 0;
            transition: background-color 0.3s;
        }
        .cta-button:hover {
            background-color: #c9a227;
        }
        .button-container {
            text-align: center;
        }
        .benefits {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
        }
        .benefits h3 {
            margin-top: 0;
            color: #1a1a2e;
        }
        .benefit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        .benefit-item {
            background-color: white;
            padding: 15px;
            border-radius: 4px;
            border-left: 3px solid #d4af37;
        }
        .benefit-item strong {
            color: #1a1a2e;
            display: block;
            margin-bottom: 5px;
        }
        .benefit-item p {
            margin: 0;
            font-size: 13px;
            color: #666;
        }
        .footer {
            background-color: #f9f9f9;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #999;
        }
        .footer a {
            color: #d4af37;
            text-decoration: none;
        }
        @media (max-width: 600px) {
            .benefit-grid {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 24px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🚗 GrayArx</h1>
            <p>Your Dealership's AI Operating System</p>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Hi <strong>${contactName}</strong>,
            </div>

            <p>We're reaching out with an exclusive opportunity for <strong>${dealershipName}</strong>.</p>

            <!-- Main Message -->
            <div class="main-message">
                <h2>Meet GrayArx: The Future of Dealership Operations</h2>
                <p>Imagine a system that works 24/7 to engage your customers, showcase your inventory, and drive test drive bookings—all automatically.</p>
                <p><strong>That's GrayArx.</strong></p>
            </div>

            <!-- What You Get -->
            <div class="features">
                <h3>What You'll Experience in Your Pilot:</h3>
                <ul class="feature-list">
                    <li>AI-powered chatbot on your website (7 languages)</li>
                    <li>WhatsApp integration for instant customer engagement</li>
                    <li>Automatic inventory browsing and test drive bookings</li>
                    <li>Pre-approval application processing</li>
                    <li>24/7 customer engagement (no staff required)</li>
                    <li>Real-time analytics and customer insights</li>
                </ul>
            </div>

            <!-- Benefits -->
            <div class="benefits">
                <h3>Why Dealerships Love GrayArx:</h3>
                <div class="benefit-grid">
                    <div class="benefit-item">
                        <strong>⏰ Save Time</strong>
                        <p>Automate customer interactions</p>
                    </div>
                    <div class="benefit-item">
                        <strong>📈 Increase Leads</strong>
                        <p>Engage 24/7 without staff</p>
                    </div>
                    <div class="benefit-item">
                        <strong>💰 Boost Sales</strong>
                        <p>Convert more inquiries</p>
                    </div>
                    <div class="benefit-item">
                        <strong>🎯 Better Data</strong>
                        <p>Understand your customers</p>
                    </div>
                </div>
            </div>

            <!-- Scarcity Box -->
            <div class="scarcity-box">
                <h3>🎯 Exclusive Pilot Offer</h3>
                <p>Only 5 dealerships qualify for this pilot</p>
                <p style="font-size: 14px; margin-bottom: 0;">First come, first served</p>
            </div>

            <!-- CTA -->
            <div class="button-container">
                <a href="https://grayarx.manus.space/onboarding/form" class="cta-button">Apply for Pilot Access</a>
            </div>

            <p style="text-align: center; color: #999; font-size: 13px;">
                This is a limited-time pilot opportunity. We're looking for dealerships ready to transform their customer engagement.
            </p>

            <p>
                Questions? Reply to this email or contact us at <strong>grayarx@gmail.com</strong> or <strong>079 491 5187</strong>.
            </p>

            <p style="color: #666; font-size: 14px;">
                Best regards,<br>
                <strong>The GrayArx Team</strong><br>
                Transforming Dealership Operations with AI
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>© 2026 GrayArx. All rights reserved.</p>
            <p>
                <a href="https://grayarx.manus.space">Visit GrayArx</a> | 
                <a href="https://grayarx.manus.space/help">Help Center</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;
}

export function generatePilotEmailText(dealershipName: string, contactName: string): string {
  return `
GrayArx - Your Dealership's AI Operating System

Hi ${contactName},

We're reaching out with an exclusive opportunity for ${dealershipName}.

MEET GRAYARX: THE FUTURE OF DEALERSHIP OPERATIONS

Imagine a system that works 24/7 to engage your customers, showcase your inventory, and drive test drive bookings—all automatically.

That's GrayArx.

WHAT YOU'LL EXPERIENCE IN YOUR PILOT:

✓ AI-powered chatbot on your website (7 languages)
✓ WhatsApp integration for instant customer engagement
✓ Automatic inventory browsing and test drive bookings
✓ Pre-approval application processing
✓ 24/7 customer engagement (no staff required)
✓ Real-time analytics and customer insights

WHY DEALERSHIPS LOVE GRAYARX:

⏰ Save Time - Automate customer interactions
📈 Increase Leads - Engage 24/7 without staff
💰 Boost Sales - Convert more inquiries
🎯 Better Data - Understand your customers

EXCLUSIVE PILOT OFFER

Only 5 dealerships qualify for this pilot
First come, first served

APPLY FOR PILOT ACCESS:
https://grayarx.manus.space/onboarding/form

This is a limited-time pilot opportunity. We're looking for dealerships ready to transform their customer engagement.

Questions? Reply to this email or contact us:
Email: grayarx@gmail.com
Phone: 079 491 5187

Best regards,
The GrayArx Team
Transforming Dealership Operations with AI

© 2026 GrayArx. All rights reserved.
Visit: https://grayarx.manus.space
Help: https://grayarx.manus.space/help
  `;
}

export const PILOT_EMAIL_SUBJECT_OPTIONS = [
  "🚗 Only 5 Spots: Your Dealership's AI Operating System (Free Pilot)",
  "Exclusive: Free AI System for Your Dealership (Limited Spots)",
  "Your Dealership Deserves Better - GrayArx Pilot Invitation",
  "Transform Your Dealership: AI-Powered Customer Engagement (Pilot)",
  "Last Chance: Join the GrayArx Pilot (5 Spots Available)",
];

export const PILOT_EMAIL_CONFIG = {
  senderName: "GrayArx Team",
  senderEmail: "pilot@grayarx.manus.space",
  campaignName: "GrayArx Pilot Launch - 100 Dealerships",
  description: "Exclusive pilot invitation for dealerships to experience AI-powered customer engagement",
};
