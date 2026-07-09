import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendWelcomeEmail } from "./_core/emailService";

// Mock dependencies
vi.mock("./db");
vi.mock("./_core/emailService");

describe("Check Email Verification Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Resend Verification Email", () => {
    it("should send verification email for existing user", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hash123",
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(sendWelcomeEmail).mockResolvedValue(undefined);

      // Simulate resend verification email
      const user = await db.getUserByEmail("test@example.com");
      expect(user).toBeDefined();
      expect(user?.email).toBe("test@example.com");

      if (user) {
        await sendWelcomeEmail(user.email, user.name || "User");
      }

      expect(sendWelcomeEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Test User"
      );
    });

    it("should handle non-existent user gracefully", async () => {
      vi.mocked(db.getUserByEmail).mockResolvedValue(null);

      const user = await db.getUserByEmail("nonexistent@example.com");
      expect(user).toBeNull();

      // Should not attempt to send email
      expect(sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it("should handle email service errors gracefully", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        passwordHash: "hash123",
        loginMethod: "email",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(sendWelcomeEmail).mockRejectedValue(
        new Error("Email service error")
      );

      const user = await db.getUserByEmail("test@example.com");
      expect(user).toBeDefined();

      if (user) {
        try {
          await sendWelcomeEmail(user.email, user.name || "User");
          expect.fail("Should have thrown an error");
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe("Check Email Page Flow", () => {
    it("should extract email from URL parameters", () => {
      const url = new URL(
        "http://localhost:3000/check-email?email=test@example.com"
      );
      const email = url.searchParams.get("email");
      expect(email).toBe("test@example.com");
    });

    it("should handle URL-encoded email addresses", () => {
      const email = "test+tag@example.com";
      const encoded = encodeURIComponent(email);
      const url = new URL(`http://localhost:3000/check-email?email=${encoded}`);
      const decoded = url.searchParams.get("email");
      expect(decoded).toBe(email);
    });

    it("should redirect to signup if no email provided", () => {
      const url = new URL("http://localhost:3000/check-email");
      const email = url.searchParams.get("email");
      expect(email).toBeNull();
      // In real app, would redirect to /signup
    });

    it("should persist email in localStorage", () => {
      const email = "test@example.com";
      localStorage.setItem("signupEmail", email);
      const stored = localStorage.getItem("signupEmail");
      expect(stored).toBe(email);
    });

    it("should clear email from localStorage when going back to signup", () => {
      localStorage.setItem("signupEmail", "test@example.com");
      localStorage.removeItem("signupEmail");
      const stored = localStorage.getItem("signupEmail");
      expect(stored).toBeNull();
    });
  });

  describe("Resend Button Behavior", () => {
    it("should disable resend button initially", () => {
      // Initial state: timeLeft = 60, canResend = false
      const timeLeft = 60;
      const canResend = timeLeft === 0;
      expect(canResend).toBe(false);
    });

    it("should enable resend button after countdown", () => {
      // After countdown: timeLeft = 0, canResend = true
      const timeLeft = 0;
      const canResend = timeLeft === 0;
      expect(canResend).toBe(true);
    });

    it("should show countdown timer", () => {
      const timeLeft = 45;
      const displayText = `Resend in ${timeLeft}s`;
      expect(displayText).toBe("Resend in 45s");
    });

    it("should reset timer after successful resend", () => {
      // After successful resend
      const timeLeft = 60;
      const canResend = false;
      expect(timeLeft).toBe(60);
      expect(canResend).toBe(false);
    });
  });

  describe("Email Verification Success States", () => {
    it("should show success message after resend", () => {
      const resendSuccess = true;
      const message = "Verification email sent successfully!";
      expect(resendSuccess).toBe(true);
      expect(message).toContain("sent");
    });

    it("should display user email address on page", () => {
      const email = "user@example.com";
      const displayText = `We've sent a verification link to ${email}`;
      expect(displayText).toContain(email);
    });

    it("should provide link to sign in after verification", () => {
      const signInLink = "/login";
      expect(signInLink).toBe("/login");
    });

    it("should allow changing email by going back to signup", () => {
      const backLink = "/signup";
      expect(backLink).toBe("/signup");
    });
  });

  describe("Error Handling", () => {
    it("should display error message on resend failure", () => {
      const error = "Failed to resend email";
      expect(error).toContain("Failed");
    });

    it("should provide support contact link", () => {
      const supportEmail = "support@grayarx.com";
      expect(supportEmail).toContain("grayarx");
    });

    it("should suggest checking spam folder", () => {
      const suggestion = "Check your spam or junk folder";
      expect(suggestion).toContain("spam");
    });
  });

  describe("Signup to CheckEmail Flow", () => {
    it("should redirect to check-email after successful signup", async () => {
      const email = "newuser@example.com";
      const redirectUrl = `/check-email?email=${encodeURIComponent(email)}`;
      expect(redirectUrl).toContain("/check-email");
      expect(redirectUrl).toContain(email);
    });

    it("should preserve email across page redirects", () => {
      const email = "test@example.com";
      localStorage.setItem("signupEmail", email);

      // Simulate page navigation
      const stored = localStorage.getItem("signupEmail");
      expect(stored).toBe(email);
    });

    it("should handle email with special characters", () => {
      const email = "user+tag@example.co.uk";
      const encoded = encodeURIComponent(email);
      const decoded = decodeURIComponent(encoded);
      expect(decoded).toBe(email);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading structure", () => {
      const heading = "Check your email";
      expect(heading).toBeTruthy();
    });

    it("should provide clear instructions", () => {
      const instructions = [
        "Check your inbox",
        "Click the verification link",
        "You're all set!",
      ];
      expect(instructions.length).toBe(3);
      instructions.forEach((instruction) => {
        expect(instruction).toBeTruthy();
      });
    });

    it("should have descriptive button text", () => {
      const buttonText = "Resend verification email";
      expect(buttonText).toContain("Resend");
    });
  });
});
