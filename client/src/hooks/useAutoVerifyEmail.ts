import { useCallback } from "react";

/**
 * Development-only hook for auto-verifying emails during testing
 * Only works in development environment (NODE_ENV === 'development')
 */
export function useAutoVerifyEmail() {
  const autoVerify = useCallback(async (userId: number): Promise<boolean> => {
    if (process.env.NODE_ENV !== "development") {
      console.warn("Auto-verify email is only available in development mode");
      return false;
    }

    try {
      const response = await fetch("/api/auth/auto-verify-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Auto-verify failed:", error);
        return false;
      }

      const data = await response.json();
      console.log("Email auto-verified for development:", data);
      return true;
    } catch (error) {
      console.error("Auto-verify error:", error);
      return false;
    }
  }, []);

  return { autoVerify };
}
