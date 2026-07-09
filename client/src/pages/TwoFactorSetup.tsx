import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, Copy, Shield } from "lucide-react";

export function TwoFactorSetup() {
  const [method, setMethod] = useState<"sms" | "email" | "authenticator">("authenticator");
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  const [step, setStep] = useState<"choose" | "setup" | "verify" | "backup">("choose");

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to generate 2FA setup
      // const response = await trpc.auth.setup2FA.useMutation();
      // setQrCode(response.qrCode);
      // setSecret(response.secret);
      setStep("verify");
    } catch (error) {
      console.error("Failed to setup 2FA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to verify 2FA code
      // const response = await trpc.auth.verify2FA.useMutation({
      //   code: verificationCode,
      //   method,
      // });
      // setBackupCodes(response.backupCodes);
      setStep("backup");
    } catch (error) {
      console.error("Failed to verify 2FA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to enable 2FA
      // await trpc.auth.enable2FA.useMutation({
      //   method,
      // });
      setIsEnabled(true);
      setStep("choose");
    } catch (error) {
      console.error("Failed to enable 2FA:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Two-Factor Authentication Enabled
          </CardTitle>
          <CardDescription>Your account is protected with 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Two-factor authentication adds an extra layer of security to your account. You'll need to provide a verification code in addition to your password when signing in.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => setIsEnabled(false)}>
            Disable 2FA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Two-Factor Authentication
        </CardTitle>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "choose" && (
          <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="authenticator">Authenticator</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="authenticator" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Use an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator
              </p>
              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Continue with Authenticator
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Receive verification codes via SMS to your phone
              </p>
              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Continue with SMS
              </Button>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Receive verification codes via email
              </p>
              <Button onClick={handleSetup} disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Continue with Email
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {step === "setup" && method === "authenticator" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Scan this QR code with your authenticator app
              </AlertDescription>
            </Alert>
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            )}
            {secret && (
              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(secret)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <Button onClick={() => setStep("verify")} className="w-full">
              I've Scanned the Code
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter the verification code from your authenticator app
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                maxLength={6}
              />
            </div>
            <Button onClick={handleVerify} disabled={isLoading || verificationCode.length !== 6} className="w-full">
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Verify Code
            </Button>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription>
                Save these backup codes in a safe place. You can use them to access your account if you lose access to your authenticator.
              </AlertDescription>
            </Alert>
            <div className="space-y-2 rounded-lg bg-muted p-4">
              {backupCodes.map((code, index) => (
                <div key={index} className="font-mono text-sm">
                  {code}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(backupCodes.join("\n"))}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy All Codes
            </Button>
            <Button onClick={handleComplete} disabled={isLoading} className="w-full">
              {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Complete Setup
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
