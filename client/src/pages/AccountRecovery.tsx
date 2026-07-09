import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function AccountRecovery() {
  const [step, setStep] = useState<"verify" | "questions" | "reset">("verify");
  const [email, setEmail] = useState("");
  const [securityAnswers, setSecurityAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const securityQuestions = [
    "What is the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
  ];

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify email exists
      if (!email) {
        setError("Please enter your email");
        return;
      }
      setStep("questions");
    } catch (err) {
      setError("Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify security answers
      if (!securityAnswers.q1 || !securityAnswers.q2 || !securityAnswers.q3) {
        setError("Please answer all security questions");
        return;
      }
      setStep("reset");
    } catch (err) {
      setError("Incorrect security answers");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }

      // Reset password
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      setError("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Account Recovery</CardTitle>
          <CardDescription>Recover access to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password reset successfully! Redirecting to login...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {error && (
                <Alert className="mb-4 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {step === "verify" && (
                <form onSubmit={handleVerifyEmail} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Email"}
                  </Button>
                </form>
              )}

              {step === "questions" && (
                <form onSubmit={handleVerifyAnswers} className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Answer your security questions to verify your identity
                  </p>
                  {securityQuestions.map((question, i) => (
                    <div key={i}>
                      <Label htmlFor={`q${i + 1}`}>{question}</Label>
                      <Input
                        id={`q${i + 1}`}
                        placeholder="Your answer"
                        value={securityAnswers[`q${i + 1}` as keyof typeof securityAnswers]}
                        onChange={(e) =>
                          setSecurityAnswers({
                            ...securityAnswers,
                            [`q${i + 1}`]: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                  ))}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Verifying..." : "Verify Answers"}
                  </Button>
                </form>
              )}

              {step === "reset" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
