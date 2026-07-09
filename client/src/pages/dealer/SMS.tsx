/**
 * SMS Messaging Page
 * Dealer dashboard for sending and managing SMS conversations
 */

import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Send, Phone, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ConversationPreview {
  dealershipId: number;
  customerPhone: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  messageCount: number;
}

export function SMSPage() {
  const [activeTab, setActiveTab] = useState("send");
  const [selectedConversation, setSelectedConversation] = useState<ConversationPreview | null>(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const statusQuery = trpc.sms.getStatus.useQuery();
  const setupGuideQuery = trpc.sms.getSetupGuide.useQuery();

  // Mutations
  const sendMessageMutation = trpc.sms.sendMessage.useMutation({
    onSuccess: () => {
      setPhone("");
      setMessage("");
      setIsDialogOpen(false);
    },
  });

  const testSendMutation = trpc.sms.testSend.useMutation();

  const handleSendMessage = async () => {
    if (!phone.trim() || !message.trim()) {
      alert("Please enter both phone number and message");
      return;
    }

    await sendMessageMutation.mutateAsync({
      phone: phone.trim(),
      message: message.trim(),
      dealershipId: 1, // TODO: Get from auth context
    });
  };

  const handleTestSend = async () => {
    if (!phone.trim()) {
      alert("Please enter a phone number");
      return;
    }

    await testSendMutation.mutateAsync({
      phone: phone.trim(),
    });
  };

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  const status = statusQuery.data;
  const setupGuide = setupGuideQuery.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-gold" />
            SMS Messaging
          </h1>
          <p className="text-muted-foreground mt-1">Send and manage SMS conversations with customers</p>
        </div>
      </div>

      {/* Status Alert */}
      {status && (
        <Alert className={status.mode === "mock" ? "border-blue-500 bg-blue-50" : "border-green-500 bg-green-50"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Status:</strong> {status.message}
            {status.mode === "mock" && (
              <span className="block text-sm mt-1">
                🧪 Sandbox mode - SMS messages are simulated. Switch to production when your Twilio number is verified.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Send Message</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>

        {/* Send Message Tab */}
        <TabsContent value="send" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Send SMS Message</h2>

            <div className="space-y-4">
              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Phone Number</label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+27821234567 or 0821234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleTestSend} disabled={testSendMutation.isPending}>
                    {testSendMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: +27821234567 (South African numbers supported)
                </p>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">{message.length} characters</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil(message.length / 160)} SMS{message.length > 160 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !phone.trim() || !message.trim()}
                className="w-full bg-gold hover:bg-gold/90 text-black"
                size="lg"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </>
                )}
              </Button>

              {/* Status Messages */}
              {sendMessageMutation.isSuccess && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    ✓ Message sent successfully! Message ID: {sendMessageMutation.data?.messageId}
                  </AlertDescription>
                </Alert>
              )}

              {sendMessageMutation.isError && (
                <Alert className="border-red-500 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    ✗ Failed to send message: {sendMessageMutation.error?.message}
                  </AlertDescription>
                </Alert>
              )}

              {testSendMutation.isSuccess && (
                <Alert className="border-blue-500 bg-blue-50">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    ✓ Test SMS sent! Mode: {testSendMutation.data?.mode}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </Card>

          {/* Quick Templates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  setMessage(
                    "Hi! Thanks for your interest in our vehicles. We have some great options available. Would you like to schedule a test drive?"
                  )
                }
                className="justify-start h-auto p-3 text-left"
              >
                <span className="text-sm">Test Drive Offer</span>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setMessage(
                    "Hello! We have a special offer on selected vehicles this week. Would you like to hear more details?"
                  )
                }
                className="justify-start h-auto p-3 text-left"
              >
                <span className="text-sm">Special Offer</span>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setMessage(
                    "Hi! Just following up on your recent inquiry. Do you have any questions about the vehicle? We're here to help!"
                  )
                }
                className="justify-start h-auto p-3 text-left"
              >
                <span className="text-sm">Follow-up</span>
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setMessage(
                    "Thank you for choosing us! Your booking is confirmed. Please arrive 10 minutes early. See you soon!"
                  )
                }
                className="justify-start h-auto p-3 text-left"
              >
                <span className="text-sm">Booking Confirmation</span>
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Conversations</h2>
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Send your first SMS to start a conversation</p>
            </div>
          </Card>
        </TabsContent>

        {/* Setup Guide Tab */}
        <TabsContent value="setup" className="space-y-6">
          {setupGuide && (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">{setupGuide.title}</h2>

                <div className="space-y-6">
                  {setupGuide.steps.map((step: any) => (
                    <div key={step.step} className="border-l-4 border-gold pl-4">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-gold text-black mt-1">{step.step}</Badge>
                        <div className="flex-1">
                          <h3 className="font-semibold">{step.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          {step.fields && (
                            <div className="mt-2 space-y-1">
                              {step.fields.map((field: string) => (
                                <code key={field} className="block text-xs bg-muted p-2 rounded">
                                  {field}
                                </code>
                              ))}
                            </div>
                          )}
                          {step.link && (
                            <a
                              href={step.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:underline text-sm mt-2 inline-block"
                            >
                              Learn more →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Notes */}
              <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3">Important Notes</h3>
                <ul className="space-y-2">
                  {setupGuide.notes.map((note: string, idx: number) => (
                    <li key={idx} className="text-sm text-blue-800 flex gap-2">
                      <span>•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
