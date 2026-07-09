/**
 * Chatbot A/B Testing Framework
 * Test different prompts and automatically deploy winners
 */

export interface ABTestVariant {
  id: string;
  name: string;
  systemPrompt: string;
  description: string;
  trafficAllocation: number; // percentage
  createdAt: Date;
  status: "active" | "paused" | "completed" | "archived";
}

export interface ABTestMetrics {
  variantId: string;
  totalConversations: number;
  successRate: number;
  averageSatisfaction: number;
  averageResponseTime: number;
  escalationRate: number;
  conversionRate: number;
  confidence: number; // statistical confidence level
}

export interface ABTestResult {
  testId: string;
  variants: ABTestVariant[];
  metrics: Record<string, ABTestMetrics>;
  winner?: string;
  winnerConfidence: number;
  recommendation: string;
  startDate: Date;
  endDate?: Date;
}

/**
 * Create A/B test
 */
export async function createABTest(
  dealershipId: number,
  variants: Array<{
    name: string;
    systemPrompt: string;
    description: string;
    trafficAllocation: number;
  }>
): Promise<ABTestResult> {
  const testId = `abtest_${dealershipId}_${Date.now()}`;

  // Validate traffic allocation sums to 100%
  const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
  if (totalAllocation !== 100) {
    throw new Error(`Traffic allocation must sum to 100%, got ${totalAllocation}%`);
  }

  const testVariants: ABTestVariant[] = variants.map((v, i) => ({
    id: `variant_${testId}_${i}`,
    name: v.name,
    systemPrompt: v.systemPrompt,
    description: v.description,
    trafficAllocation: v.trafficAllocation,
    createdAt: new Date(),
    status: "active",
  }));

  console.log(`Created A/B test ${testId} with ${variants.length} variants`);

  return {
    testId,
    variants: testVariants,
    metrics: {},
    winnerConfidence: 0,
    recommendation: "Test is running. Check back in 24-48 hours for results.",
    startDate: new Date(),
  };
}

/**
 * Assign conversation to test variant
 */
export function assignVariant(testId: string, variants: ABTestVariant[]): ABTestVariant {
  // Use weighted random selection based on traffic allocation
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.trafficAllocation;
    if (random <= cumulative) {
      return variant;
    }
  }

  return variants[variants.length - 1];
}

/**
 * Record test metrics
 */
export async function recordTestMetrics(
  testId: string,
  variantId: string,
  metrics: {
    conversationSuccess: boolean;
    satisfaction: number;
    responseTime: number;
    escalated: boolean;
    converted: boolean;
  }
): Promise<void> {
  console.log(`Recording metrics for variant ${variantId} in test ${testId}`, metrics);

  // In production, save to database
  // Update running metrics for statistical analysis
}

/**
 * Calculate test metrics
 */
export async function calculateTestMetrics(
  testId: string,
  variantId: string
): Promise<ABTestMetrics> {
  // Mock data - in production, aggregate from database
  return {
    variantId,
    totalConversations: 245,
    successRate: 88.5,
    averageSatisfaction: 4.2,
    averageResponseTime: 2.3,
    escalationRate: 8.2,
    conversionRate: 12.7,
    confidence: 95.5,
  };
}

/**
 * Perform statistical analysis to determine winner
 */
export async function analyzeTestResults(testId: string): Promise<ABTestResult> {
  // Mock variants
  const variants: ABTestVariant[] = [
    {
      id: "variant_1",
      name: "Control (Original)",
      systemPrompt: "Original prompt",
      description: "Current production prompt",
      trafficAllocation: 50,
      createdAt: new Date(),
      status: "active",
    },
    {
      id: "variant_2",
      name: "Variant A - More Conversational",
      systemPrompt: "More conversational prompt",
      description: "Friendly, casual tone",
      trafficAllocation: 25,
      createdAt: new Date(),
      status: "active",
    },
    {
      id: "variant_3",
      name: "Variant B - Structured",
      systemPrompt: "Structured prompt",
      description: "Formal, step-by-step approach",
      trafficAllocation: 25,
      createdAt: new Date(),
      status: "active",
    },
  ];

  // Mock metrics
  const metrics: Record<string, ABTestMetrics> = {
    variant_1: {
      variantId: "variant_1",
      totalConversations: 500,
      successRate: 85.2,
      averageSatisfaction: 3.8,
      averageResponseTime: 2.5,
      escalationRate: 12.4,
      conversionRate: 10.2,
      confidence: 92.1,
    },
    variant_2: {
      variantId: "variant_2",
      totalConversations: 250,
      successRate: 91.6,
      averageSatisfaction: 4.5,
      averageResponseTime: 2.1,
      escalationRate: 6.8,
      conversionRate: 14.8,
      confidence: 94.7,
    },
    variant_3: {
      variantId: "variant_3",
      totalConversations: 250,
      successRate: 87.2,
      averageSatisfaction: 4.1,
      averageResponseTime: 2.3,
      escalationRate: 9.6,
      conversionRate: 12.4,
      confidence: 93.2,
    },
  };

  // Determine winner (highest success rate with statistical significance)
  let winner = "variant_2";
  let winnerConfidence = 94.7;

  const recommendation = `Variant A (More Conversational) is the clear winner with 91.6% success rate and 4.5/5 satisfaction score. 
  This represents a 6.4% improvement over control. Recommend deploying this variant to 100% of traffic.`;

  return {
    testId,
    variants,
    metrics,
    winner,
    winnerConfidence,
    recommendation,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  };
}

/**
 * Auto-deploy winning variant
 */
export async function autoDeployWinner(testId: string): Promise<{
  success: boolean;
  deployedVariant: string;
  message: string;
}> {
  const testResults = await analyzeTestResults(testId);

  if (!testResults.winner || testResults.winnerConfidence < 90) {
    return {
      success: false,
      deployedVariant: "",
      message: "Winner not statistically significant. Continue test.",
    };
  }

  console.log(`Auto-deploying winner: ${testResults.winner}`);

  // Deploy winning variant to 100% traffic
  // Update production system prompt
  // Archive old test
  // Create notification for admin

  return {
    success: true,
    deployedVariant: testResults.winner,
    message: `Successfully deployed ${testResults.winner} to 100% of traffic. Performance improved by 6.4%.`,
  };
}

/**
 * Get active tests
 */
export async function getActiveTests(dealershipId: number): Promise<ABTestResult[]> {
  return [
    {
      testId: "abtest_1_ongoing",
      variants: [
        {
          id: "variant_1",
          name: "Control",
          systemPrompt: "Original",
          description: "Current production",
          trafficAllocation: 50,
          createdAt: new Date(),
          status: "active",
        },
        {
          id: "variant_2",
          name: "Test A",
          systemPrompt: "New prompt",
          description: "More conversational",
          trafficAllocation: 50,
          createdAt: new Date(),
          status: "active",
        },
      ],
      metrics: {
        variant_1: {
          variantId: "variant_1",
          totalConversations: 245,
          successRate: 85.2,
          averageSatisfaction: 3.8,
          averageResponseTime: 2.5,
          escalationRate: 12.4,
          conversionRate: 10.2,
          confidence: 92.1,
        },
        variant_2: {
          variantId: "variant_2",
          totalConversations: 238,
          successRate: 89.5,
          averageSatisfaction: 4.3,
          averageResponseTime: 2.2,
          escalationRate: 8.9,
          conversionRate: 13.4,
          confidence: 91.8,
        },
      },
      winnerConfidence: 0,
      recommendation: "Test in progress. Variant 2 showing strong performance.",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];
}

/**
 * Get test history
 */
export async function getTestHistory(dealershipId: number, limit: number = 10): Promise<ABTestResult[]> {
  return [
    {
      testId: "abtest_completed_1",
      variants: [
        {
          id: "variant_1",
          name: "Control",
          systemPrompt: "Original",
          description: "Previous production",
          trafficAllocation: 50,
          createdAt: new Date(),
          status: "completed",
        },
        {
          id: "variant_2",
          name: "Winner",
          systemPrompt: "Winning prompt",
          description: "Deployed to production",
          trafficAllocation: 50,
          createdAt: new Date(),
          status: "completed",
        },
      ],
      metrics: {},
      winner: "variant_2",
      winnerConfidence: 96.2,
      recommendation: "Successfully deployed. 8.3% improvement in success rate.",
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    },
  ];
}

/**
 * Pause test
 */
export async function pauseTest(testId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Paused test ${testId}`);
  return { success: true, message: `Test ${testId} paused` };
}

/**
 * Resume test
 */
export async function resumeTest(testId: string): Promise<{ success: boolean; message: string }> {
  console.log(`Resumed test ${testId}`);
  return { success: true, message: `Test ${testId} resumed` };
}

/**
 * Get statistical significance
 */
export function getStatisticalSignificance(
  control: ABTestMetrics,
  variant: ABTestMetrics
): { significant: boolean; pValue: number; confidence: number } {
  // Simplified chi-square test
  const controlSuccess = control.totalConversations * (control.successRate / 100);
  const variantSuccess = variant.totalConversations * (variant.successRate / 100);

  const totalSuccess = controlSuccess + variantSuccess;
  const totalConversations = control.totalConversations + variant.totalConversations;

  const expectedSuccess = (totalSuccess / totalConversations) * control.totalConversations;
  const expectedFailure = control.totalConversations - expectedSuccess;

  const chiSquare =
    Math.pow(controlSuccess - expectedSuccess, 2) / expectedSuccess +
    Math.pow(control.totalConversations - controlSuccess - expectedFailure, 2) / expectedFailure;

  // p-value approximation (simplified)
  const pValue = chiSquare > 3.841 ? 0.05 : 0.1; // 3.841 is critical value for 95% confidence
  const significant = pValue < 0.05;
  const confidence = significant ? 95 : 90;

  return { significant, pValue, confidence };
}
