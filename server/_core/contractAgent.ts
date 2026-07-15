/**
 * Contract & Onboarding Agent - Automates post-deal workflow
 * 
 * Handles:
 * - Contract generation from template
 * - E-signature collection (DocuSign/HelloSign integration ready)
 * - Onboarding workflow automation
 * - Team training materials
 * - Go-live checklist
 */

import { invokeLLM } from "./llm";
import { z } from "zod";

export interface ContractTemplate {
  id: string;
  name: string;
  content: string; // HTML template with {{variables}}
  variables: string[];
}

export interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // "dealership" or "grayarx"
  dueDate: Date;
  completed: boolean;
  completedAt: Date | null;
  notes: string;
}

export interface OnboardingWorkflow {
  dealershipId: string;
  dealershipName: string;
  contractId: string;
  
  // Contract Status
  contractStatus: "draft" | "sent" | "signed" | "executed";
  contractUrl: string;
  signatureDate: Date | null;
  
  // Onboarding Progress
  tasks: OnboardingTask[];
  completionPercentage: number;
  
  // Timeline
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  
  // Contacts
  dealershipPrimaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  dealershipTechnicalContact: {
    name: string;
    email: string;
    phone: string;
  };
}

/**
 * Generate a contract from template with dealership-specific data
 */
export async function generateContract(input: {
  dealershipName: string;
  dealershipAddress: string;
  dealershipEmail: string;
  dealershipPhone: string;
  contactName: string;
  estimatedMonthlyLeads: number;
  estimatedAnnualValue: number;
  serviceStartDate: Date;
  template: ContractTemplate;
}): Promise<string> {
  try {
    // Replace template variables
    let contractHtml = input.template.content;

    const variables = {
      dealershipName: input.dealershipName,
      dealershipAddress: input.dealershipAddress,
      dealershipEmail: input.dealershipEmail,
      dealershipPhone: input.dealershipPhone,
      contactName: input.contactName,
      estimatedMonthlyLeads: input.estimatedMonthlyLeads,
      estimatedAnnualValue: input.estimatedAnnualValue,
      serviceStartDate: input.serviceStartDate.toLocaleDateString("en-ZA"),
      executionDate: new Date().toLocaleDateString("en-ZA"),
    };

    Object.entries(variables).forEach(([key, value]) => {
      contractHtml = contractHtml.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    });

    return contractHtml;
  } catch (error) {
    console.error("[Contract] Generation failed:", error);
    throw error;
  }
}

/**
 * Create onboarding workflow with tasks
 */
export function createOnboardingWorkflow(input: {
  dealershipId: string;
  dealershipName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  technicalContactName: string;
  technicalContactEmail: string;
  technicalContactPhone: string;
}): OnboardingWorkflow {
  const now = new Date();
  const startDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

  // Standard onboarding tasks
  const tasks: OnboardingTask[] = [
    {
      id: "task-1",
      title: "Account Setup",
      description: "Create dealership account and admin user",
      assignedTo: "grayarx",
      dueDate: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "task-2",
      title: "Team Access Setup",
      description: "Create user accounts for dealership team members",
      assignedTo: "dealership",
      dueDate: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "task-3",
      title: "Vehicle Inventory Import",
      description: "Import current vehicle inventory into GrayArx",
      assignedTo: "dealership",
      dueDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "CSV or direct integration",
    },
    {
      id: "task-4",
      title: "Email Configuration",
      description: "Configure dealership email domain and Resend setup",
      assignedTo: "grayarx",
      dueDate: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "task-5",
      title: "WhatsApp Business Setup",
      description: "Connect WhatsApp Business account",
      assignedTo: "dealership",
      dueDate: new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "Optional but recommended",
    },
    {
      id: "task-6",
      title: "Team Training",
      description: "Conduct team training on GrayArx platform",
      assignedTo: "grayarx",
      dueDate: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "60-minute session",
    },
    {
      id: "task-7",
      title: "Test Drive",
      description: "Run test leads through system",
      assignedTo: "dealership",
      dueDate: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "5-10 test leads",
    },
    {
      id: "task-8",
      title: "Go-Live Approval",
      description: "Final approval and go-live",
      assignedTo: "grayarx",
      dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
      notes: "",
    },
  ];

  return {
    dealershipId: input.dealershipId,
    dealershipName: input.dealershipName,
    contractId: `contract-${Date.now()}`,
    contractStatus: "draft",
    contractUrl: "",
    signatureDate: null,
    tasks,
    completionPercentage: 0,
    createdAt: now,
    startedAt: null,
    completedAt: null,
    dealershipPrimaryContact: {
      name: input.primaryContactName,
      email: input.primaryContactEmail,
      phone: input.primaryContactPhone,
    },
    dealershipTechnicalContact: {
      name: input.technicalContactName,
      email: input.technicalContactEmail,
      phone: input.technicalContactPhone,
    },
  };
}

/**
 * Mark task as complete
 */
export function completeTask(
  workflow: OnboardingWorkflow,
  taskId: string,
  notes?: string
): OnboardingWorkflow {
  const now = new Date();
  return {
    ...workflow,
    tasks: workflow.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: true,
            completedAt: now,
            notes: notes || t.notes,
          }
        : t
    ),
    completionPercentage: Math.round(
      (workflow.tasks.filter((t) => t.id === taskId ? true : t.completed).length /
        workflow.tasks.length) *
        100
    ),
  };
}

/**
 * Generate onboarding email for dealership
 */
export async function generateOnboardingEmail(
  dealershipName: string,
  contactName: string,
  workflowUrl: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are writing a professional onboarding welcome email from GrayArx to a new dealership partner.
Be warm, clear, and action-oriented. Include the onboarding dashboard link.
Keep it under 300 words.`,
        },
        {
          role: "user",
          content: `Write a welcome onboarding email for:
Dealership: ${dealershipName}
Contact: ${contactName}
Onboarding Dashboard: ${workflowUrl}

Include:
- Welcome message
- What to expect in the next 7 days
- Key contacts at GrayArx
- Link to onboarding dashboard
- Next steps
- Enthusiasm about partnership`,
        },
      ],
    });

    const content = response.choices[0].message.content;
    return typeof content === "string" ? content : "Onboarding email generation failed";
  } catch (error) {
    console.error("[Contract] Email generation failed:", error);
    return `Welcome to GrayArx, ${dealershipName}! We're excited to partner with you. Your onboarding dashboard is ready at ${workflowUrl}`;
  }
}

/**
 * Generate training materials
 */
export async function generateTrainingMaterials(dealershipName: string): Promise<{
  gettingStarted: string;
  agentGuide: string;
  bestPractices: string;
  faq: string;
}> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are creating training materials for a new GrayArx dealership partner.
Return JSON with 4 sections (each 200-300 words):
- gettingStarted: How to log in and navigate the dashboard
- agentGuide: Overview of each AI agent and what they do
- bestPractices: Tips for getting the most from GrayArx
- faq: Common questions and answers

Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: `Create training materials for ${dealershipName}. Focus on practical, actionable guidance.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "training_materials",
          strict: true,
          schema: {
            type: "object",
            properties: {
              gettingStarted: { type: "string" },
              agentGuide: { type: "string" },
              bestPractices: { type: "string" },
              faq: { type: "string" },
            },
            required: ["gettingStarted", "agentGuide", "bestPractices", "faq"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return {
      gettingStarted: "Log in to your dashboard...",
      agentGuide: "GrayArx has 10 AI agents...",
      bestPractices: "Best practices for success...",
      faq: "Common questions...",
    };
  } catch (error) {
    console.error("[Contract] Training materials generation failed:", error);
    return {
      gettingStarted: "Training materials generation failed",
      agentGuide: "Please contact support",
      bestPractices: "Please contact support",
      faq: "Please contact support",
    };
  }
}

/**
 * Generate go-live checklist
 */
export function generateGoLiveChecklist(): OnboardingTask[] {
  return [
    {
      id: "golive-1",
      title: "All team members trained",
      description: "Confirm all dealership staff completed training",
      assignedTo: "dealership",
      dueDate: new Date(),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "golive-2",
      title: "Inventory imported",
      description:
        "All vehicles in system with photos; no R1/placeholder prices left on available stock (fix in Inventory or Settings → Fix R1 prices)",
      assignedTo: "dealership",
      dueDate: new Date(),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "golive-3",
      title: "Test leads processed",
      description: "5-10 test leads successfully processed",
      assignedTo: "dealership",
      dueDate: new Date(),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "golive-4",
      title: "Email working",
      description: "Dealership emails being received and responded to",
      assignedTo: "grayarx",
      dueDate: new Date(),
      completed: false,
      completedAt: null,
      notes: "",
    },
    {
      id: "golive-5",
      title: "Support contact established",
      description: "Dealership knows how to reach support",
      assignedTo: "grayarx",
      dueDate: new Date(),
      completed: false,
      completedAt: null,
      notes: "",
    },
  ];
}
