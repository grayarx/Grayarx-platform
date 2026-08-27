import { getDb } from "../db";
import { helpArticles, onboardingTours } from "../../drizzle/schema";

/**
 * Seed initial help articles and onboarding tours
 * Run with: pnpm tsx server/seeds/help-content.seed.ts
 */

async function seedHelpContent() {
  const db = await getDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  console.log("Seeding help articles and tours...");

  // Seed Help Articles
  const articles = [
    {
      title: "Getting Started with GrayArx",
      slug: "getting-started",
      category: "Getting Started",
      content: `# Getting Started with GrayArx

Welcome to GrayArx, your dealership's AI operating system. This guide will help you get up and running in minutes.

## What is GrayArx?

GrayArx is an intelligent platform designed specifically for South African car dealerships. It automates customer interactions, manages inventory, and provides AI-powered insights to grow your business.

## Key Features

- **AI Agents**: Automated customer service via email, calls, and WhatsApp
- **Inventory Management**: Organize and showcase your vehicles
- **Lead Management**: Track and convert customer inquiries
- **Analytics**: Real-time insights into your dealership's performance
- **Multi-location Support**: Manage multiple dealerships from one dashboard

## Your First Steps

1. **Sign in** to your dashboard
2. **Upload your inventory** using CSV import
3. **Configure your AI agents** with your dealership's tone
4. **Start receiving leads** from customers

## Need Help?

Check out our help center or contact support@grayarx.com`,
      excerpt: "Learn the basics of GrayArx and get your dealership set up",
      keywords: "getting started, setup, basics, tutorial",
      order: 1,
      isPublished: 1,
    },
    {
      title: "Managing Your Inventory",
      slug: "managing-inventory",
      category: "Inventory",
      content: `# Managing Your Inventory

Keep your vehicle inventory organized and up-to-date.

## Adding Vehicles

1. Navigate to **Inventory** in the sidebar
2. Click **Add Vehicle**
3. Fill in vehicle details (make, model, year, price, etc.)
4. Upload photos
5. Click **Save**

## Bulk Import

For faster setup, import multiple vehicles at once:

1. Go to **Inventory** → **Import**
2. Download the CSV template
3. Fill in your vehicle data
4. Upload the file
5. Review and confirm

## Vehicle Photos

- Upload up to 10 photos per vehicle
- Use high-quality images for better conversions
- First photo becomes the thumbnail

## Pricing & Availability

Update vehicle prices and availability status anytime. Changes are reflected instantly on your showroom.`,
      excerpt: "Learn how to add, manage, and organize your vehicle inventory",
      keywords: "inventory, vehicles, photos, pricing, import",
      order: 2,
      isPublished: 1,
    },
    {
      title: "Understanding Your Dashboard",
      slug: "understanding-dashboard",
      category: "Dashboard",
      content: `# Understanding Your Dashboard

Your dashboard gives you a complete overview of your dealership's performance.

## Key Metrics

- **Total Leads**: All customer inquiries received
- **Conversion Rate**: Percentage of leads that become bookings
- **Average Response Time**: How quickly your agents respond
- **Customer Satisfaction**: Feedback from customers

## Activity Feed

See real-time updates of:
- New leads received
- Customer messages
- Booking confirmations
- Agent activities

## Charts & Reports

- **Lead Trends**: See how many leads you're getting over time
- **Conversion Funnel**: Track leads through the sales process
- **Revenue Insights**: Monitor your dealership's financial performance

## Customizing Your Dashboard

Click the settings icon to:
- Choose which metrics to display
- Set date ranges for reports
- Export data for analysis`,
      excerpt: "Get the most out of your dashboard and understand your key metrics",
      keywords: "dashboard, metrics, analytics, reports, performance",
      order: 3,
      isPublished: 1,
    },
    {
      title: "AI Agents Explained",
      slug: "ai-agents-explained",
      category: "AI Agents",
      content: `# AI Agents Explained

GrayArx includes a 24/7 AI team. Lerato pencils test drives; your staff confirm the slot. Outbound voice is not in the pilot.

## Mia - Email Agent

Responds to customer emails automatically with personalized, professional replies.

- Handles inquiries about vehicles
- Drafts follow-ups
- Hands booking intent to Lerato
- Available 24/7

## Lerato - Booking Agent

Pencils test-drive requests and customer appointments.

- Collects name and preferred time
- Suggests the next in-hours slot
- Hands a reference number to the buyer
- Your team confirms, reschedules, or cancels from Bookings

Outbound voice (Themba) is GrayArx’s own sales caller to dealerships. Your yard never gets him, and he never calls your buyers.

## Sipho - Prospector Agent

Finds new potential customers in your region.

- Identifies dealership prospects
- Researches business opportunities
- Prepares handoff notes
- Scores prospects by fit

## Customizing Your Agents

Configure each agent's:
- Tone and personality
- Response templates
- Working hours
- Languages`,
      excerpt: "Learn about GrayArx's four intelligent AI agents",
      keywords: "agents, AI, automation, email, calls, booking, prospecting",
      order: 4,
      isPublished: 1,
    },
    {
      title: "Lead Management Best Practices",
      slug: "lead-management",
      category: "Leads",
      content: `# Lead Management Best Practices

Maximize your conversion rate with these proven strategies.

## Lead Statuses

- **New**: Just received, not yet contacted
- **Contacted**: You've reached out to the customer
- **Qualified**: Customer is interested and meets criteria
- **Converted**: Customer has made a purchase
- **Lost**: Customer is no longer interested

## Following Up

- Follow up within 24 hours of receiving a lead
- Use multiple channels (email, SMS, phone)
- Personalize your messages
- Track all interactions

## Scoring Leads

GrayArx automatically scores leads based on:
- Vehicle interest
- Budget indicators
- Urgency signals
- Previous interactions

## Converting More Leads

1. **Respond quickly** - First response within 1 hour
2. **Be helpful** - Answer questions thoroughly
3. **Build trust** - Share customer reviews and testimonials
4. **Make it easy** - Offer multiple ways to schedule test drives
5. **Follow up** - Stay in touch even if they're not ready yet`,
      excerpt: "Strategies to convert more leads into customers",
      keywords: "leads, conversion, follow-up, sales, best practices",
      order: 5,
      isPublished: 1,
    },
    {
      title: "Troubleshooting Common Issues",
      slug: "troubleshooting",
      category: "Support",
      content: `# Troubleshooting Common Issues

Solutions to common problems you might encounter.

## Agents Not Responding

- Check if agents are enabled in settings
- Verify business hours are configured correctly
- Ensure email/phone credentials are valid
- Check internet connection

## Inventory Not Showing

- Verify vehicles are published (not in draft)
- Check that all required fields are filled
- Clear browser cache and refresh
- Try a different browser

## Slow Performance

- Clear browser cache
- Disable browser extensions
- Check internet speed
- Try on a different device

## Login Issues

- Reset your password if you've forgotten it
- Clear cookies and try again
- Use incognito/private browsing mode
- Contact support if issues persist

## Still Need Help?

Email us at support@grayarx.com or call 079 491 5187`,
      excerpt: "Quick fixes for common problems",
      keywords: "troubleshooting, issues, problems, help, support",
      order: 6,
      isPublished: 1,
    },
  ];

  // Insert articles
  for (const article of articles) {
    try {
      await db.insert(helpArticles).values(article);
      console.log(`✓ Created article: ${article.title}`);
    } catch (error: any) {
      if (error.message.includes("Duplicate entry")) {
        console.log(`⊘ Article already exists: ${article.title}`);
      } else {
        console.error(`✗ Failed to create article: ${article.title}`, error.message);
      }
    }
  }

  // Seed Onboarding Tours
  const tours = [
    {
      title: "Dashboard Tour",
      description: "Learn how to navigate your dashboard and understand key metrics",
      targetRole: "user" as const,
      targetPage: "/dashboard",
      order: 1,
      isActive: 1,
    },
    {
      title: "Inventory Management",
      description: "Learn how to add, edit, and manage your vehicle inventory",
      targetRole: "user" as const,
      targetPage: "/dealer/inventory",
      order: 2,
      isActive: 1,
    },
    {
      title: "Lead Management",
      description: "Discover how to track and convert customer leads",
      targetRole: "user" as const,
      targetPage: "/dealer/leads",
      order: 3,
      isActive: 1,
    },
  ];

  // Insert tours
  for (const tour of tours) {
    try {
      await db.insert(onboardingTours).values(tour);
      console.log(`✓ Created tour: ${tour.title}`);
    } catch (error: any) {
      if (error.message.includes("Duplicate entry")) {
        console.log(`⊘ Tour already exists: ${tour.title}`);
      } else {
        console.error(`✗ Failed to create tour: ${tour.title}`, error.message);
      }
    }
  }

  console.log("\n✓ Help content seeding complete!");
  console.log("✓ 6 help articles created");
  console.log("✓ 3 onboarding tours created");
  console.log("\nTour steps can be added via the tRPC API or admin panel.");
  process.exit(0);
}

seedHelpContent().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
