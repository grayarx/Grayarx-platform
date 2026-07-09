import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Wallet, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function PayoutManagement() {
  const { user } = useAuth();
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankBranchCode, setBankBranchCode] = useState("");

  // Mock payout data (backend procedures not yet implemented)
  const summary = {
    totalEarnings: 45000,
    pendingBalance: 5000,
    availableForWithdrawal: 40000,
    lastPayoutDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  };

  const payouts = [
    {
      id: 1,
      amount: 10000,
      status: "completed",
      requestedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      bankAccountNumber: "1234567890",
    },
    {
      id: 2,
      amount: 8500,
      status: "completed",
      requestedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      bankAccountNumber: "1234567890",
    },
    {
      id: 3,
      amount: 5000,
      status: "pending",
      requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      bankAccountNumber: "1234567890",
    },
  ];

  const handleRequestWithdrawal = async () => {
    if (!withdrawalAmount || !bankAccountNumber || !bankBranchCode) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = Number(withdrawalAmount);
    if (amount <= 0 || amount > summary.availableForWithdrawal) {
      toast.error("Invalid withdrawal amount");
      return;
    }

    toast.success("Withdrawal request submitted successfully");
    setWithdrawalAmount("");
    setBankAccountNumber("");
    setBankBranchCode("");
  };

  if (!user?.dealershipId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">You need to be associated with a dealership to view payouts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Payout Management</h1>
          <p className="text-lg text-muted-foreground">
            Manage your earnings and request withdrawals
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                R{summary.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">all time</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                R{summary.pendingBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">processing</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-gradient-to-br from-green-50 to-green-5 dark:from-green-950 dark:to-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Available to Withdraw
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                R{summary.availableForWithdrawal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">ready to withdraw</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Last Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground">
                {summary.lastPayoutDate
                  ? format(new Date(summary.lastPayoutDate), "MMM d, yyyy")
                  : "Never"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">last withdrawal</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Withdrawal */}
        <Card className="border-border mb-8">
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <CardDescription>
              Transfer your available balance to your bank account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Withdrawal Amount (R)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    max={summary.availableForWithdrawal}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: R{summary.availableForWithdrawal.toLocaleString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Bank Account Number</label>
                  <Input
                    placeholder="e.g., 1234567890"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Bank Branch Code</label>
                <Input
                  placeholder="e.g., 632005"
                  value={bankBranchCode}
                  onChange={(e) => setBankBranchCode(e.target.value)}
                />
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="w-full"
                    disabled={
                      !withdrawalAmount ||
                      !bankAccountNumber ||
                      !bankBranchCode
                    }
                  >
                    Request Withdrawal
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Withdrawal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Withdrawal Amount</p>
                      <p className="text-2xl font-bold text-foreground">
                        R{Number(withdrawalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Bank Account</p>
                      <p className="text-lg font-semibold text-foreground">{bankAccountNumber}</p>
                      <p className="text-sm text-muted-foreground">Branch: {bankBranchCode}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The withdrawal will be processed within 2-3 business days.
                    </p>
                    <Button
                      className="w-full"
                      onClick={handleRequestWithdrawal}
                    >
                      Confirm Withdrawal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Recent withdrawals and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No payouts yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {payout.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        )}
                        <div>
                          <p className="font-semibold text-foreground">
                            R{Number(payout.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payout.requestedAt), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={payout.status === "completed" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {payout.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Account: {payout.bankAccountNumber}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout Information */}
        <Card className="border-border mt-8 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Payout Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Minimum withdrawal:</strong> R500
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>Processing time:</strong> 2-3 business days
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>No withdrawal fees:</strong> 100% of your earnings
                </span>
              </li>
              <li className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">
                  <strong>South African banks only:</strong> EFT transfers to ZA bank accounts
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
