import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Trash2, Link2 } from "lucide-react";

interface ConnectedAccount {
  id: string;
  provider: "google" | "apple";
  email: string;
  name: string;
  linkedAt: string;
  lastUsed?: string;
}

export default function ConnectedAccounts() {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([
    {
      id: "1",
      provider: "google",
      email: "user@gmail.com",
      name: "John Doe",
      linkedAt: "2 months ago",
      lastUsed: "1 week ago",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState<string | null>(null);

  const handleConnectProvider = async (provider: "google" | "apple") => {
    setLoading(true);
    try {
      // Redirect to OAuth flow
      window.location.href = `/api/oauth/${provider}/authorize`;
    } catch (error) {
      console.error(`Failed to connect ${provider}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (accountId: string) => {
    setLoading(true);
    try {
      // Call tRPC procedure to unlink account
      setConnectedAccounts(connectedAccounts.filter((acc) => acc.id !== accountId));
      setShowUnlinkConfirm(null);
    } catch (error) {
      console.error("Failed to unlink account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connected Accounts</h1>
        <p className="text-muted-foreground mt-2">Manage your social login connections</p>
      </div>

      <Alert>
        <AlertDescription>
          Connecting social accounts allows you to sign in with Google or Apple ID in addition to your email and password.
        </AlertDescription>
      </Alert>

      {/* Connected Accounts List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        {connectedAccounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No connected accounts yet</p>
            </CardContent>
          </Card>
        ) : (
          connectedAccounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-semibold capitalize">{account.provider}</p>
                      <p className="text-sm text-muted-foreground">{account.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Linked {account.linkedAt}
                        {account.lastUsed && ` • Last used ${account.lastUsed}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>Connected</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowUnlinkConfirm(account.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {showUnlinkConfirm === account.id && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-3">
                      Are you sure you want to unlink this account?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUnlink(account.id)}
                        disabled={loading}
                      >
                        {loading ? "Unlinking..." : "Unlink"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUnlinkConfirm(null)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Available Providers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Providers</h2>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google</CardTitle>
            <CardDescription>Sign in with your Google account</CardDescription>
          </CardHeader>
          <CardContent>
            {connectedAccounts.some((acc) => acc.provider === "google") ? (
              <Badge>Connected</Badge>
            ) : (
              <Button
                onClick={() => handleConnectProvider("google")}
                disabled={loading}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Connect Google
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Apple</CardTitle>
            <CardDescription>Sign in with your Apple ID</CardDescription>
          </CardHeader>
          <CardContent>
            {connectedAccounts.some((acc) => acc.provider === "apple") ? (
              <Badge>Connected</Badge>
            ) : (
              <Button
                onClick={() => handleConnectProvider("apple")}
                disabled={loading}
                className="w-full"
              >
                <Link2 className="mr-2 h-4 w-4" />
                Connect Apple
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
