/**
 * SMS Conversation Viewer Component
 * Displays message history and allows sending new messages
 */

import React, { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Send, Phone, MessageCircle, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SMSConversationViewerProps {
  dealershipId: number;
  customerPhone: string;
  onClose?: () => void;
}

interface Message {
  id: number;
  direction: "inbound" | "outbound";
  content: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: Date;
}

export function SMSConversationViewer({
  dealershipId,
  customerPhone,
  onClose,
}: SMSConversationViewerProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const conversationQuery = trpc.sms.getConversationHistory.useQuery({
    dealershipId,
    customerPhone,
  });

  // Mutations
  const sendMessageMutation = trpc.sms.sendMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      // Refetch conversation
      conversationQuery.refetch();
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationQuery.data?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    await sendMessageMutation.mutateAsync({
      phone: customerPhone,
      message: newMessage.trim(),
      dealershipId,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (conversationQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  const messages = conversationQuery.data?.messages || [];

  return (
    <Card className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{customerPhone}</h3>
            <p className="text-xs text-muted-foreground">{messages.length} messages</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation below</p>
            </div>
          </div>
        ) : (
          messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.direction === "outbound"
                    ? "bg-gold text-black rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
              >
                <p className="text-sm break-words">{message.content}</p>
                <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                  {message.direction === "outbound" && (
                    <>
                      {message.status === "sent" && <Clock className="w-3 h-3" />}
                      {message.status === "delivered" && <CheckCircle2 className="w-3 h-3" />}
                      {message.status === "failed" && <AlertCircle className="w-3 h-3" />}
                    </>
                  )}
                  <span>{formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-card space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            size="icon"
            className="bg-gold hover:bg-gold/90 text-black"
          >
            {sendMessageMutation.isPending ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{newMessage.length} characters</p>
      </div>
    </Card>
  );
}
