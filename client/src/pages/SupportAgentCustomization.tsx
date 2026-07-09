import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Plus, AlertCircle } from "lucide-react";

const agentSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Valid hex color required"),
  personalityTone: z.enum(["formal", "casual", "friendly", "urgent"]),
  customGreeting: z.string().min(1, "Greeting is required"),
});

type AgentFormData = z.infer<typeof agentSchema>;

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["bug", "feature_request", "user_error", "performance", "other"]),
  severity: z.enum(["critical", "high", "medium", "low"]),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export function SupportAgentCustomization() {
  const { user } = useAuth();
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Fetch support agent
  const { data: agent, isLoading: agentLoading } = trpc.marketplace.getSupportAgent.useQuery(
    { dealershipId: user?.dealershipId || 0 },
    { enabled: !!user?.dealershipId }
  );

  // Fetch support tickets
  const { data: tickets = [], isLoading: ticketsLoading } = trpc.marketplace.getDealershipTickets.useQuery(
    { dealershipId: user?.dealershipId || 0 },
    { enabled: !!user?.dealershipId }
  );

  // Agent form
  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "Support Agent",
      brandColor: "#d4af37",
      personalityTone: "friendly",
      customGreeting: "Hi! I'm here to help.",
    },
  });

  // Ticket form
  const ticketForm = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "bug",
      severity: "medium",
    },
  });

  // Update agent when data loads
  useEffect(() => {
    if (agent) {
      agentForm.reset({
        name: agent.name || "Support Agent",
        brandColor: agent.brandColor || "#d4af37",
        personalityTone: agent.personalityTone || "friendly",
        customGreeting: agent.customGreeting || "Hi! I'm here to help.",
      });
    }
  }, [agent, agentForm]);

  // Update agent mutation
  const updateAgent = trpc.marketplace.updateSupportAgent.useMutation({
    onSuccess: () => {
      toast.success("Support agent updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update agent");
    },
  });

  // Create ticket mutation
  const createTicket = trpc.marketplace.createSupportTicket.useMutation({
    onSuccess: () => {
      toast.success("Support ticket created");
      ticketForm.reset();
      setShowNewTicketForm(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create ticket");
    },
  });

  async function onUpdateAgent(data: AgentFormData) {
    if (!user?.dealershipId) return;
    await updateAgent.mutateAsync({
      dealershipId: user.dealershipId,
      ...data,
    });
  }

  async function onCreateTicket(data: TicketFormData) {
    if (!user?.dealershipId) return;
    await createTicket.mutateAsync({
      dealershipId: user.dealershipId,
      ...data,
    });
  }

  if (!user?.dealershipId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">You need to be associated with a dealership to access this page.</p>
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
          <h1 className="text-4xl font-bold text-foreground mb-2">Support Agent Customization</h1>
          <p className="text-lg text-muted-foreground">
            Customize your AI support agent and manage support tickets
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Customization */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Customize Your Support Agent</CardTitle>
                <CardDescription>
                  Personalize how your AI support agent interacts with customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Form {...agentForm}>
                    <form onSubmit={agentForm.handleSubmit(onUpdateAgent)} className="space-y-6">
                      <FormField
                        control={agentForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agent Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Support Agent, Alex, Customer Care"
                                {...field}
                                disabled={updateAgent.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={agentForm.control}
                        name="customGreeting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Greeting Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="How should the agent greet customers?"
                                rows={3}
                                {...field}
                                disabled={updateAgent.isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={agentForm.control}
                        name="personalityTone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personality Tone</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={updateAgent.isPending}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="formal">Formal & Professional</SelectItem>
                                <SelectItem value="casual">Casual & Relaxed</SelectItem>
                                <SelectItem value="friendly">Friendly & Warm</SelectItem>
                                <SelectItem value="urgent">Urgent & Direct</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={agentForm.control}
                        name="brandColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Color (Hex)</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input
                                  placeholder="#d4af37"
                                  {...field}
                                  disabled={updateAgent.isPending}
                                />
                              </FormControl>
                              <div
                                className="w-12 h-10 rounded border border-input"
                                style={{ backgroundColor: field.value }}
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={updateAgent.isPending}
                      >
                        {updateAgent.isPending ? "Updating..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div>
            <Card className="border-border sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="p-4 rounded-lg text-white text-sm"
                  style={{ backgroundColor: agentForm.watch("brandColor") || "#d4af37" }}
                >
                  <p className="font-bold mb-2">{agentForm.watch("name")}</p>
                  <p className="text-sm opacity-90">{agentForm.watch("customGreeting")}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">TONE</p>
                  <Badge variant="outline" className="capitalize">
                    {agentForm.watch("personalityTone")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Tickets */}
        <Card className="border-border mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Report issues and request features</CardDescription>
            </div>
            <Button
              onClick={() => setShowNewTicketForm(!showNewTicketForm)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </CardHeader>

          <CardContent>
            {showNewTicketForm && (
              <div className="mb-6 p-4 border border-border rounded-lg">
                <Form {...ticketForm}>
                  <form onSubmit={ticketForm.handleSubmit(onCreateTicket)} className="space-y-4">
                    <FormField
                      control={ticketForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Brief description of the issue"
                              {...field}
                              disabled={createTicket.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={ticketForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detailed description of the issue"
                              rows={4}
                              {...field}
                              disabled={createTicket.isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={ticketForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={createTicket.isPending}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bug">Bug Report</SelectItem>
                                <SelectItem value="feature_request">Feature Request</SelectItem>
                                <SelectItem value="user_error">User Error</SelectItem>
                                <SelectItem value="performance">Performance</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ticketForm.control}
                        name="severity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Severity</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange} disabled={createTicket.isPending}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={createTicket.isPending}
                      >
                        {createTicket.isPending ? "Creating..." : "Create Ticket"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewTicketForm(false);
                          ticketForm.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {ticketsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No support tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{ticket.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="capitalize">
                          {ticket.category.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant={
                            ticket.severity === "critical" ? "destructive" :
                            ticket.severity === "high" ? "default" :
                            "secondary"
                          }
                          className="capitalize"
                        >
                          {ticket.severity}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ticket.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Status: <Badge variant="outline" className="capitalize ml-1">{ticket.status}</Badge></span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
