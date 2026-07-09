import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Lock, Smartphone, Mail, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function AccountSecurity() {
  const { user } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState<string>("");
  const [showQrCode, setShowQrCode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const enable2FAMutation = trpc.twoFactor.enable2FA.useMutation();
  const disable2FAMutation = trpc.twoFactor.disable2FA.useMutation();
  const generateBackupCodesMutation = trpc.twoFactor.generateBackupCodes.useMutation();
  const verify2FAMutation = trpc.twoFactor.verify2FA.useMutation();

  const handleEnable2FA = async () => {
    try {
      const result = await enable2FAMutation.mutateAsync({ method: "authenticator" });
      setQrCode(result.qrCode || "");
      setShowQrCode(true);
      toast.success("2FA setup started. Scan the QR code with your authenticator app.");
    } catch (error) {
      toast.error("Failed to enable 2FA");
      console.error("Failed to enable 2FA:", error);
    }
  };

  const handleVerify2FA = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    try {
      await verify2FAMutation.mutateAsync({ code: otpCode, secret: "" });
      setTwoFAEnabled(true);
      setShowQrCode(false);
      setOtpCode("");
      toast.success("2FA has been enabled successfully!");
    } catch (error) {
      toast.error("Invalid verification code");
      console.error("Failed to verify 2FA:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handleGenerateBackupCodes = async () => {
    try {
      const result = await generateBackupCodesMutation.mutateAsync();
      setBackupCodes(result?.codes || []);
      setShowBackupCodes(true);
      toast.success("Backup codes generated. Save them in a secure location.");
    } catch (error) {
      toast.error("Failed to generate backup codes");
      console.error("Failed to generate backup codes:", error);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) {
      return;
    }

    try {
      await disable2FAMutation.mutateAsync({ method: "authenticator" });
      setTwoFAEnabled(false);
      setBackupCodes([]);
      setShowQrCode(false);
      toast.success("2FA has been disabled");
    } catch (error) {
      toast.error("Failed to disable 2FA");
      console.error("Failed to disable 2FA:", error);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Security</h1>
        <p className="text-muted-foreground mt-2">Manage your security settings and authentication methods</p>
      </div>

      {/* 2FA Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!twoFAEnabled ? (
            <>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                </AlertDescription>
              </Alert>
              <Button onClick={handleEnable2FA} disabled={enable2FAMutation.isPending}>
                {enable2FAMutation.isPending ? "Setting up..." : "Enable 2FA"}
              </Button>

              {showQrCode && (
                <div className="space-y-4 mt-4">
                  <div className="bg-white p-4 rounded-lg border">
                    <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enter the 6-digit code from your authenticator app:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                      <Button onClick={handleVerify2FA} disabled={verifying || otpCode.length !== 6}>
                        {verifying ? "Verifying..." : "Verify"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                  <span className="text-sm text-muted-foreground">Your account is protected</span>
                </div>
                <Button variant="destructive" onClick={handleDisable2FA} disabled={disable2FAMutation.isPending}>
                  {disable2FAMutation.isPending ? "Disabling..." : "Disable 2FA"}
                </Button>
              </div>

              <Button onClick={handleGenerateBackupCodes} variant="outline" disabled={generateBackupCodesMutation.isPending}>
                {generateBackupCodesMutation.isPending ? "Generating..." : "Generate Backup Codes"}
              </Button>

              {showBackupCodes && (
                <div className="space-y-2 mt-4">
                  <Alert>
                    <AlertDescription>
                      Save these backup codes in a secure location. You can use them to access your account if you lose access to your authenticator app.
                    </AlertDescription>
                  </Alert>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                    {backupCodes.map((code, i) => (
                      <div key={i}>{code}</div>
                    ))}
                  </div>
                  <Button onClick={copyBackupCodes} variant="outline" className="w-full">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Backup Codes
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Change Password</Button>
        </CardContent>
      </Card>

      {/* Connected Accounts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Connected Accounts
          </CardTitle>
          <CardDescription>Manage your social login connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="border">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="text-2xl">🔵</div>
                <h3 className="font-semibold">Google</h3>
                <Button variant="outline" className="w-full">
                  Connect
                </Button>
              </CardContent>
            </Card>
            <Card className="border">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="text-2xl">🍎</div>
                <h3 className="font-semibold">Apple</h3>
                <Button variant="outline" className="w-full">
                  Connect
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-muted-foreground">This browser</p>
              </div>
              <Badge>Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
