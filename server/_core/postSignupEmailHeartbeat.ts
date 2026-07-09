/**
 * Heartbeat handler for post-signup email processing
 * Runs every 5 minutes to process pending email sequences
 */

import { processPendingEmailSequences } from "./postSignupEmailService";

export interface HeartbeatRequest {
  trigger?: string;
  timestamp?: number;
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
  processedCount?: number;
  error?: string;
}

/**
 * Process pending post-signup emails
 * Called by Heartbeat every 5 minutes
 */
export async function handlePostSignupEmailHeartbeat(
  req: HeartbeatRequest
): Promise<HeartbeatResponse> {
  try {
    console.log("[PostSignupEmailHeartbeat] Processing pending emails...");

    // Process all pending emails
    await processPendingEmailSequences();

    return {
      success: true,
      message: "Post-signup email processing completed",
    };
  } catch (error) {
    console.error("[PostSignupEmailHeartbeat] Error:", error);
    return {
      success: false,
      message: "Failed to process post-signup emails",
      error: String(error),
    };
  }
}

/**
 * Express handler for Heartbeat webhook
 */
export function createPostSignupEmailHeartbeatHandler() {
  return async (req: any, res: any) => {
    try {
      const result = await handlePostSignupEmailHeartbeat(req.body || {});
      res.json(result);
    } catch (error) {
      console.error("[PostSignupEmailHeartbeat] Handler error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: String(error),
      });
    }
  };
}
