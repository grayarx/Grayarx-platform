import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export function InventoryManagementPage() {
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.inventory.getStats.useQuery();
  const { data: allVehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = trpc.inventory.list.useQuery({ limit: 100 });
  const { data: availableVehicles, isLoading: availableLoading } = trpc.inventory.getAvailable.useQuery({ limit: 100 });

  const markSoldMutation = trpc.inventory.markSold.useMutation({
    onSuccess: () => {
      toast.success("Vehicle marked as sold");
      refetchVehicles();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark vehicle as sold");
    },
  });

  const markAvailableMutation = trpc.inventory.markAvailable.useMutation({
    onSuccess: () => {
      toast.success("Vehicle marked as available");
      refetchVehicles();
      refetchStats();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark vehicle as available");
    },
  });

  const deleteMutation = trpc.inventory.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted");
      refetchVehicles();
      refetchStats();
      setSelectedVehicle(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete vehicle");
    },
  });

  const isLoading = statsLoading || vehiclesLoading || availableLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your vehicle inventory, track sales, and update vehicle status
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All vehicles in inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.available}</div>
              <p className="text-xs text-muted-foreground">{stats.availablePercentage}% of inventory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Sold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
              <p className="text-xs text-muted-foreground">Marked as sold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Sales conversion</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Vehicles ({allVehicles?.length || 0})</TabsTrigger>
          <TabsTrigger value="available">Available ({availableVehicles?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Vehicles</CardTitle>
              <CardDescription>View and manage all vehicles in your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : allVehicles && allVehicles.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{vehicle.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.price && `R${parseFloat(vehicle.price).toLocaleString()}`}
                          {vehicle.km && ` • ${vehicle.km.toLocaleString()} km`}
                          {vehicle.color && ` • ${vehicle.color}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={vehicle.status === "available" ? "default" : "secondary"}>
                          {vehicle.status === "available" ? "Available" : "Sold"}
                        </Badge>

                        <div className="flex gap-2">
                          {vehicle.status === "available" ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedVehicle(vehicle.id)}
                                >
                                  Mark Sold
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogTitle>Mark Vehicle as Sold?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This vehicle will be removed from the AI chatbot's available inventory and won't be suggested to customers.
                                </AlertDialogDescription>
                                <div className="flex gap-2 justify-end">
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      if (selectedVehicle) {
                                        markSoldMutation.mutate({ id: selectedVehicle });
                                      }
                                    }}
                                  >
                                    Mark Sold
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAvailableMutation.mutate({ id: vehicle.id })}
                              disabled={markAvailableMutation.isPending}
                            >
                              Restore
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setSelectedVehicle(vehicle.id)}
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The vehicle will be permanently removed from your inventory.
                              </AlertDialogDescription>
                              <div className="flex gap-2 justify-end">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    if (selectedVehicle) {
                                      deleteMutation.mutate({ id: selectedVehicle });
                                    }
                                  }}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No vehicles in inventory. Upload a CSV to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Vehicles</CardTitle>
              <CardDescription>Vehicles currently available for customer inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : availableVehicles && availableVehicles.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div className="flex-1">
                        <div className="font-semibold">{vehicle.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {vehicle.price && `R${parseFloat(vehicle.price).toLocaleString()}`}
                          {vehicle.km && ` • ${vehicle.km.toLocaleString()} km`}
                          {vehicle.color && ` • ${vehicle.color}`}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedVehicle(vehicle.id)}
                            >
                              Mark Sold
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Mark Vehicle as Sold?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This vehicle will be removed from the AI chatbot's available inventory.
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  if (selectedVehicle) {
                                    markSoldMutation.mutate({ id: selectedVehicle });
                                  }
                                }}
                              >
                                Mark Sold
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No available vehicles. Upload a CSV or restore sold vehicles.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
