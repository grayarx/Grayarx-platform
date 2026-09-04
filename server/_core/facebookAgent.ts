/**
 * Facebook Marketing Agent — Manages GrayArx Facebook business page
 * Posts content, responds to comments, and builds business credibility
 */

import { z } from "zod";
import { protectedProcedure, router } from "./trpc";
import { TRPCError } from "@trpc/server";

/**
 * Facebook page content templates for credibility
 */
export const FACEBOOK_CONTENT_TEMPLATES = {
  about: {
    title: "About GrayArx",
    content: `GrayArx — Nala Dealership OS

Every unanswered 9pm WhatsApp is a deal you already paid for.

Independent yards drop a CSV. Nala answers after hours from live stock, books the test drive, and Monday you see this week's numbers. Runs next to your current listings — nothing to cancel.

14-day Pilot is R0 (150 WhatsApp cap, no card). Then most yards keep Professional OS at R14,990/mo because recovered gross already paid for the desk.

Call: 079 491 5187
Email: hello@grayarx.com
www.grayarx.com/onboarding`,
  },

  mission: {
    title: "Our Mission",
    content: `Our mission is simple: stop independent yards losing after-hours deals to the dealer who replies.

You should not need a night shift to answer “is this still available?” Nala does — from your live stock — so dinner is dinner.

14-day Pilot on your CSV: www.grayarx.com/onboarding`,
  },

  testimonial: {
    title: "Prove it on your stock — not on a quote we wrote",
    content: `We do not invent case studies.

The proof is this week's numbers on YOUR cars: drop a CSV, Nala answers 9pm WhatsApps, you see recovered drives vs the OS desk.

14 days. R0. No card. If the leakage is smaller than we both thought, you walk.

www.grayarx.com/for-dealers`,
  },

  features: {
    title: "What happens to a 9pm WhatsApp today?",
    content: `Most yards: it waits until 8am. The buyer does not.

Nala answers from your live CSV. Mia drips the cold ones. Missed calls bounce to WhatsApp. Monday: this week's numbers.

That is the desk. Not a chatbot widget.

Start the 14-day Pilot: www.grayarx.com/onboarding`,
  },

  faq: {
    title: "FAQ: How Much Does GrayArx Cost?",
    content: `💰 FAQ: How Much Does GrayArx Cost?

We're an **AI dealership OS**. 14-day Pilot is R0 (150 WhatsApp conversations). After they see this week's numbers, most yards close **Professional OS at R14,990/mo**. Starter OS is R7,990; Enterprise from R29,990.

Nala answers after-hours WhatsApp from live stock, plus parts, service, trade-in, and missed-call recovery.

Join the Pilot: www.grayarx.com/onboarding`,
  },

  compliance: {
    title: "We're POPIA Compliant",
    content: `🔒 GrayArx is POPIA Compliant

Your customers' data is safe with us.

Our compliance measures:
✅ Data encryption in transit and at rest
✅ Secure data storage in South Africa
✅ Consent management for all communications
✅ Right to access, correct, and delete personal data
✅ Regular security audits
✅ GDPR-aligned privacy policies

We take data privacy seriously. That's why dealerships trust GrayArx.

Learn more about our security: www.grayarx.com/security`,
  },

  cta: {
    title: "Warning: your 9pm WhatsApps are paying the next dealer",
    content: `They already raised their hand. Silence is a decision.

Give us your CSV. Nala answers tonight from your stock. 14-day Pilot — R0, no card. Then this week's numbers decide.

👉 www.grayarx.com/onboarding

Questions? Call 079 491 5187 or email hello@grayarx.com`,
  },
};

/**
 * Facebook agent router
 */
export const facebookAgentRouter = router({
  /**
   * Get all available content templates
   */
  getContentTemplates: protectedProcedure.query(() => {
    return Object.entries(FACEBOOK_CONTENT_TEMPLATES).map(([key, value]) => ({
      id: key,
      title: value.title,
      preview: value.content.substring(0, 100) + "...",
    }));
  }),

  /**
   * Get full content for a template
   */
  getContentTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(({ input }) => {
      const template = FACEBOOK_CONTENT_TEMPLATES[input.templateId as keyof typeof FACEBOOK_CONTENT_TEMPLATES];

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      return template;
    }),

  /**
   * Generate post for Facebook
   * (In production, this would connect to Facebook Graph API to post)
   */
  generatePost: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        customText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const template = FACEBOOK_CONTENT_TEMPLATES[input.templateId as keyof typeof FACEBOOK_CONTENT_TEMPLATES];

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      const content = input.customText || template.content;

      // In production, call Facebook Graph API here
      // const response = await facebookAPI.post('/me/feed', {
      //   message: content,
      //   link: 'https://www.grayarx.com'
      // });

      return {
        success: true,
        postId: `post_${Date.now()}`,
        title: template.title,
        content,
        scheduledFor: new Date(),
        status: "pending", // Would be "published" after actual posting
      };
    }),

  /**
   * Schedule post for later
   */
  schedulePost: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        scheduledTime: z.date(),
        customText: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const template = FACEBOOK_CONTENT_TEMPLATES[input.templateId as keyof typeof FACEBOOK_CONTENT_TEMPLATES];

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found",
        });
      }

      const content = input.customText || template.content;

      // In production, schedule with Facebook Graph API
      // const response = await facebookAPI.post('/me/feed', {
      //   message: content,
      //   scheduled_publish_time: Math.floor(input.scheduledTime.getTime() / 1000)
      // });

      return {
        success: true,
        postId: `post_${Date.now()}`,
        title: template.title,
        content,
        scheduledFor: input.scheduledTime,
        status: "scheduled",
      };
    }),

  /**
   * Get posting schedule recommendations
   */
  getPostingSchedule: protectedProcedure.query(() => {
    return {
      recommended: [
        { day: "Monday", time: "09:00", reason: "Start the week strong" },
        { day: "Wednesday", time: "14:00", reason: "Mid-week engagement peak" },
        { day: "Friday", time: "10:00", reason: "Friday motivation" },
      ],
      frequency: "3 posts per week",
      bestTimes: ["09:00", "12:00", "14:00", "17:00"],
      note: "Adjust based on your audience analytics",
    };
  }),

  /**
   * Get page info and settings
   */
  getPageInfo: protectedProcedure.query(() => {
    return {
      pageName: "GrayArx",
      pageUrl: "https://facebook.com/grayarx",
      category: "Software/Technology",
      description: "The Dealership AI Operating System",
      phone: "079 491 5187",
      email: "grayarx@gmail.com",
      website: "www.grayarx.com",
      followers: 0, // Would be fetched from Facebook API
      engagement: "Building credibility and trust",
    };
  }),

  /**
   * Get content calendar
   */
  getContentCalendar: protectedProcedure.query(() => {
    return {
      week1: [
        { day: "Monday", template: "about", status: "scheduled" },
        { day: "Wednesday", template: "mission", status: "scheduled" },
        { day: "Friday", template: "features", status: "scheduled" },
      ],
      week2: [
        { day: "Monday", template: "testimonial", status: "scheduled" },
        { day: "Wednesday", template: "faq", status: "scheduled" },
        { day: "Friday", template: "compliance", status: "scheduled" },
      ],
      week3: [
        { day: "Monday", template: "cta", status: "scheduled" },
        { day: "Wednesday", template: "about", status: "scheduled" },
        { day: "Friday", template: "features", status: "scheduled" },
      ],
    };
  }),

  /**
   * Respond to comment (simulated)
   */
  respondToComment: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
        response: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, post reply via Facebook Graph API
      // const response = await facebookAPI.post(`/${input.commentId}/replies`, {
      //   message: input.response
      // });

      return {
        success: true,
        commentId: input.commentId,
        response: input.response,
        postedAt: new Date(),
        status: "published",
      };
    }),
});
