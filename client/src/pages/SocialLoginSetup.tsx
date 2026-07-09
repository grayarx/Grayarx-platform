import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2, Link2, Unlink2 } from "lucide-react";

interface LinkedAccount {
  provider: "google" | "apple";
  email: string;
  linkedAt: string;
}

export function SocialLoginSetup() {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleLinkGoogle = async () => {
    setLoadingProvider("google");
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to initiate Google OAuth
      // const response = await trpc.auth.linkSocialAccount.useMutation({
      //   provider: "google",
      // });
      // window.location.href = response.authUrl;
      console.log("Linking Google account...");
    } catch (error) {
      console.error("Failed to link Google account:", error);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleLinkApple = async () => {
    setLoadingProvider("apple");
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to initiate Apple OAuth
      // const response = await trpc.auth.linkSocialAccount.useMutation({
      //   provider: "apple",
      // });
      // window.location.href = response.authUrl;
      console.log("Linking Apple account...");
    } catch (error) {
      console.error("Failed to link Apple account:", error);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleUnlink = async (provider: "google" | "apple") => {
    setIsLoading(true);
    try {
      // TODO: Call tRPC procedure to unlink social account
      // await trpc.auth.unlinkSocialAccount.useMutation({
      //   provider,
      // });
      setLinkedAccounts(linkedAccounts.filter((acc) => acc.provider !== provider));
    } catch (error) {
      console.error("Failed to unlink account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isGoogleLinked = linkedAccounts.some((acc) => acc.provider === "google");
  const isAppleLinked = linkedAccounts.some((acc) => acc.provider === "apple");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Connected Accounts
        </CardTitle>
        <CardDescription>Link your social accounts for faster sign-in</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You can link your Google or Apple account to sign in faster. Your email will be used to match accounts.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {/* Google Account */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <text x="0" y="20" fontSize="20" fill="#4285F4">
                    G
                  </text>
                </svg>
              </div>
              <div>
                <p className="font-medium">Google</p>
                {isGoogleLinked && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </p>
                )}
              </div>
            </div>
            {isGoogleLinked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlink("google")}
                disabled={isLoading}
              >
                <Unlink2 className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleLinkGoogle}
                disabled={isLoading || loadingProvider === "google"}
              >
                {loadingProvider === "google" ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : null}
                Connect
              </Button>
            )}
          </div>

          {/* Apple Account */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 13.5c-.91 0-1.82-.33-2.5-1.02A4.84 4.84 0 0 0 12 10.5c-2.64 0-4.8 2.16-4.8 4.8s2.16 4.8 4.8 4.8c1.89 0 3.54-1.1 4.35-2.7h2.6c-.9 2.5-3.37 4.2-6.35 4.2-3.59 0-6.5-2.91-6.5-6.5S8.41 8.6 12 8.6c3.59 0 6.5 2.91 6.5 6.5v1.4h-1.45z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Apple</p>
                {isAppleLinked && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </p>
                )}
              </div>
            </div>
            {isAppleLinked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUnlink("apple")}
                disabled={isLoading}
              >
                <Unlink2 className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleLinkApple}
                disabled={isLoading || loadingProvider === "apple"}
              >
                {loadingProvider === "apple" ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : null}
                Connect
              </Button>
            )}
          </div>
        </div>

        {linkedAccounts.length > 0 && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription>
              You can now sign in with your connected accounts
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
