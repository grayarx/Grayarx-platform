/**
 * GrayArx Support Chatbot Knowledge Base
 * Comprehensive FAQ and information for dealership inquiries
 *
 * Prefer shared/dealerQaPlaybook.ts for current product truths (injected at search time).
 */

import {
  formatDealerQaReply,
  matchDealerQa,
} from "../../shared/dealerQaPlaybook";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  priority: number;
}

export const CHATBOT_FAQ: FAQItem[] = [
  // ---- What is GrayArx ----
  {
    id: "what-is-grayarx",
    question: "What is GrayArx?",
    answer:
      "GrayArx is an AI-powered dealership operating system that automates customer engagement 24/7. It includes web chatbots, WhatsApp integration, inventory management, test drive booking, and pre-approval processing—all powered by artificial intelligence.",
    category: "General",
    keywords: ["what", "grayarx", "platform", "system"],
    priority: 10,
  },

  {
    id: "how-grayarx-works",
    question: "How does GrayArx work?",
    answer:
      "GrayArx deploys AI chatbots on your website and WhatsApp. Customers can browse your inventory, book test drives, and apply for pre-approval through these chatbots. All interactions are tracked and analyzed to help you understand customer behavior and improve sales.",
    category: "General",
    keywords: ["how", "work", "process", "function"],
    priority: 9,
  },

  // ---- Pilot Program ----
  {
    id: "pilot-program",
    question: "What is the pilot program?",
    answer:
      "The GrayArx pilot program offers 5 selected dealerships free access to the full platform for 30 days. This is an exclusive opportunity to experience all features, including web chatbots, WhatsApp integration, inventory management, and analytics—at no cost.",
    category: "Pilot",
    keywords: ["pilot", "free", "trial", "program", "30 days"],
    priority: 10,
  },

  {
    id: "pilot-eligibility",
    question: "How do I apply for the pilot?",
    answer:
      "Simply visit https://grayarx.manus.space/onboarding/form and fill out the application form. Include your dealership name, contact information, and vehicle inventory details. We'll review applications and notify selected dealerships within 48 hours.",
    category: "Pilot",
    keywords: ["apply", "application", "pilot", "sign up", "register"],
    priority: 9,
  },

  {
    id: "pilot-duration",
    question: "How long is the pilot program?",
    answer:
      "The pilot program lasts 30 days. During this time, you get full access to all GrayArx features at no cost. After the pilot ends, you can choose to subscribe to a paid plan or discontinue.",
    category: "Pilot",
    keywords: ["duration", "how long", "30 days", "pilot"],
    priority: 8,
  },

  // ---- Features ----
  {
    id: "web-chatbot",
    question: "What is the web chatbot?",
    answer:
      "The web chatbot is an AI-powered widget that appears on your dealership website. It helps customers browse your inventory, ask questions, book test drives, and apply for pre-approval—all without leaving your site. It's available 24/7 in 7 South African languages.",
    category: "Features",
    keywords: ["web", "chatbot", "website", "widget"],
    priority: 9,
  },

  {
    id: "whatsapp-integration",
    question: "How does WhatsApp integration work?",
    answer:
      "GrayArx can deploy a WhatsApp chatbot that customers can message directly. They can browse inventory, ask questions, book test drives, and get instant responses. It's perfect for reaching customers on their preferred communication channel.",
    category: "Features",
    keywords: ["whatsapp", "integration", "messaging", "mobile"],
    priority: 9,
  },

  {
    id: "inventory-management",
    question: "How do I manage my inventory in GrayArx?",
    answer:
      "You can upload your vehicle inventory through the GrayArx dashboard. Add vehicle details, photos (PNG, JPEG, WebP, GIF, BMP, TIFF, HEIC), pricing, and specifications. The chatbots will automatically display this inventory to customers.",
    category: "Features",
    keywords: ["inventory", "vehicles", "management", "upload", "photos"],
    priority: 8,
  },

  {
    id: "test-drive-booking",
    question: "Can customers book test drives through GrayArx?",
    answer:
      "Yes! Customers can book test drives directly through the web or WhatsApp chatbot. They select a vehicle, choose a date and time, and provide their contact information. You'll receive notifications for each booking.",
    category: "Features",
    keywords: ["test drive", "booking", "appointment", "schedule"],
    priority: 8,
  },

  {
    id: "pre-approval",
    question: "What is the pre-approval feature?",
    answer:
      "Customers can apply for vehicle pre-approval directly through the chatbot. They provide basic financial information, and GrayArx processes the application. This helps you identify serious buyers and streamline the sales process.",
    category: "Features",
    keywords: ["pre-approval", "financing", "credit", "application"],
    priority: 7,
  },

  {
    id: "analytics",
    question: "What analytics does GrayArx provide?",
    answer:
      "GrayArx provides real-time analytics including: customer inquiries, test drive bookings, pre-approval applications, chatbot interactions, customer behavior patterns, and sales performance. Use these insights to optimize your dealership operations.",
    category: "Features",
    keywords: ["analytics", "reports", "data", "insights", "statistics"],
    priority: 8,
  },

  // ---- Pricing ----
  {
    id: "pricing",
    question: "How much does GrayArx cost?",
    answer:
      "GrayArx offers flexible pricing based on your dealership size and needs. We have Starter, Professional, and Enterprise plans. During the pilot program, you get full access free for 30 days. Contact us at grayarx@gmail.com for detailed pricing information.",
    category: "Pricing",
    keywords: ["price", "cost", "pricing", "plans", "subscription"],
    priority: 8,
  },

  {
    id: "payment-terms",
    question: "What are the payment terms?",
    answer:
      "GrayArx operates on a monthly subscription model. You can cancel anytime. We accept all major payment methods. The pilot program is completely free for 30 days.",
    category: "Pricing",
    keywords: ["payment", "terms", "billing", "subscription", "monthly"],
    priority: 7,
  },

  // ---- Technical ----
  {
    id: "setup-time",
    question: "How long does it take to set up GrayArx?",
    answer:
      "Setup typically takes 1-2 hours. You'll need to: 1) Create an account, 2) Upload your vehicle inventory, 3) Add photos and pricing, 4) Deploy the chatbot on your website. Our support team can help guide you through each step.",
    category: "Technical",
    keywords: ["setup", "installation", "deploy", "time", "how long"],
    priority: 8,
  },

  {
    id: "photo-formats",
    question: "What photo formats does GrayArx support?",
    answer:
      "GrayArx supports: PNG, JPEG, JPG, WebP, GIF, BMP, TIFF, HEIC, and HEIF. Maximum file size is 15MB per image. You can upload multiple photos per vehicle and set one as the primary image.",
    category: "Technical",
    keywords: ["photos", "images", "formats", "upload", "heic"],
    priority: 7,
  },

  {
    id: "languages",
    question: "What languages does GrayArx support?",
    answer:
      "GrayArx chatbots are available in 7 South African languages: English, Afrikaans, Zulu, Xhosa, Sotho, Tswana, and Venda. Customers can select their preferred language when interacting with the chatbot.",
    category: "Technical",
    keywords: ["languages", "multilingual", "south african", "translation"],
    priority: 7,
  },

  {
    id: "integrations",
    question: "What systems does GrayArx integrate with?",
    answer:
      "GrayArx integrates with: WhatsApp Business API, email services, SMS providers, Google Maps, and popular payment processors. We're constantly adding new integrations. Contact support for specific integration requests.",
    category: "Technical",
    keywords: ["integration", "api", "connect", "third-party", "systems"],
    priority: 6,
  },

  // ---- Support ----
  {
    id: "support-hours",
    question: "What are your support hours?",
    answer:
      "GrayArx AI support is available 24/7 through this chatbot. For urgent issues or complex support needs, email support@grayarx.com or call 079 491 5187. Our team responds within 2 hours during business hours.",
    category: "Support",
    keywords: ["support", "help", "hours", "contact", "assistance"],
    priority: 8,
  },

  {
    id: "training",
    question: "Do you provide training?",
    answer:
      "Yes! GrayArx includes comprehensive training: interactive onboarding tours, video tutorials, help center articles, and live support. During the pilot, we provide personalized training to ensure you get the most out of the platform.",
    category: "Support",
    keywords: ["training", "learn", "tutorial", "education", "onboarding"],
    priority: 7,
  },

  {
    id: "data-security",
    question: "Is my dealership data secure?",
    answer:
      "Absolutely. GrayArx uses enterprise-grade security: SSL encryption, regular backups, GDPR compliance, and strict access controls. Your customer data and inventory information are protected with industry-leading security standards.",
    category: "Support",
    keywords: ["security", "data", "privacy", "safe", "encryption"],
    priority: 8,
  },

  // ---- Getting Started ----
  {
    id: "next-steps",
    question: "What should I do next?",
    answer:
      "1) Apply for the pilot program at https://grayarx.manus.space/onboarding/form\n2) Upload your vehicle inventory\n3) Deploy the chatbot on your website\n4) Start receiving customer inquiries\n5) Monitor analytics and optimize\n\nOur support team will guide you through each step!",
    category: "Getting Started",
    keywords: ["next", "steps", "start", "begin", "how to"],
    priority: 9,
  },

  {
    id: "contact-sales",
    question: "How do I contact the sales team?",
    answer:
      "You can reach our sales team at:\n📧 Email: sales@grayarx.com\n📞 Phone: 079 491 5187\n💬 WhatsApp: +27 79 491 5187\n\nWe're happy to discuss your dealership's specific needs and how GrayArx can help.",
    category: "Getting Started",
    keywords: ["contact", "sales", "email", "phone", "reach"],
    priority: 8,
  },
];

/**
 * Find relevant FAQ items based on user query.
 * Dealer Q&A playbook wins when it matches (current July 2026 truths).
 */
export function findRelevantFAQ(query: string): FAQItem[] {
  const playbookHit = matchDealerQa(query);
  if (playbookHit) {
    return [
      {
        id: `playbook_${playbookHit.id}`,
        question: playbookHit.question,
        answer: formatDealerQaReply(playbookHit),
        category: playbookHit.theme,
        keywords: playbookHit.keywords,
        priority: 100,
      },
    ];
  }

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/);

  return CHATBOT_FAQ.filter((item) => {
    const questionMatch = item.question.toLowerCase().includes(queryLower);
    const answerMatch = item.answer.toLowerCase().includes(queryLower);
    const keywordMatch = keywords.some((kw) =>
      item.keywords.some((k) => k.includes(kw) || kw.includes(k))
    );

    return questionMatch || answerMatch || keywordMatch;
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Get random FAQ items for suggestions
 */
export function getRandomFAQSuggestions(count: number = 3): FAQItem[] {
  const shuffled = [...CHATBOT_FAQ].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get FAQ items by category
 */
export function getFAQByCategory(category: string): FAQItem[] {
  return CHATBOT_FAQ.filter((item) => item.category === category).sort(
    (a, b) => b.priority - a.priority
  );
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
  const categories = new Set(CHATBOT_FAQ.map((item) => item.category));
  return Array.from(categories).sort();
}
