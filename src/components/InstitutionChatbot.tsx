import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { UpdateAction } from "@/pages/api/update-college-intent";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  actions?: { label: string; onClick: () => void }[];
}

interface InstitutionChatbotProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InstitutionChatbot = ({ open, onOpenChange }: InstitutionChatbotProps) => {
  const [pendingActions, setPendingActions] = useState<UpdateAction[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          text: "👋 Hi! I'm your CLEP data assistant. I can help you:\n\n• Update exam scores and credits\n• Answer questions about CLEP policies\n• Guide you through data management\n• Find specific exam information\n\nWhat would you like to do today?",
          sender: "ai",
          timestamp: new Date(),
          actions: [
            { label: "Update an exam", onClick: () => handleQuickAction("update") },
            { label: "View all my data", onClick: () => handleQuickAction("view") },
            { label: "How do I bulk edit?", onClick: () => handleQuickAction("bulk") },
            { label: "Explain CLEP scoring", onClick: () => handleQuickAction("scoring") },
          ],
        },
      ]);
    }
  }, [open]);

  const handleQuickAction = (action: string) => {
    const actionMessages: { [key: string]: string } = {
      update: "Update an exam",
      view: "View all my data",
      bulk: "How do I bulk edit?",
      scoring: "Explain CLEP scoring",
    };
    
    setInput(actionMessages[action] || "");
    setTimeout(() => handleSend(actionMessages[action]), 100);
  };
  /*
  const getAIResponse = (userMessage: string): { text: string; actions?: { label: string; onClick: () => void }[] } => {
    const lower = userMessage.toLowerCase();

    // Update exam pattern
    if (lower.includes("update") && (lower.includes("biology") || lower.includes("exam"))) {
      return {
        text: "Got it! I'll help you update Biology CLEP.\n\nCurrent settings:\n• Min Score: 50\n• Credits: 4\n\nWhat would you like to change?",
        actions: [
          {
            label: "Change Score to 55",
            onClick: () => {
              toast({ title: "✅ Updated!", description: "Biology minimum score changed to 55" });
            },
          },
          {
            label: "Change Credits",
            onClick: () => {
              toast({ title: "Info", description: "Credits update feature coming soon" });
            },
          },
          { label: "Cancel", onClick: () => {} },
        ],
      };
    }
    
    // View data
    if (lower.includes("view") || lower.includes("show")) {
      return {
        text: "Here are your CLEP exams:\n\n📚 Biology\nMin Score: 50 | Credits: 4\n\n🧪 Chemistry\nMin Score: 55 | Credits: 3\n\n🧮 Calculus\nMin Score: 60 | Credits: 4\n\n📖 English Composition\nMin Score: 50 | Credits: 3\n\nWould you like to update any of these?",
        actions: [
          { label: "Update Biology", onClick: () => handleQuickAction("update") },
          { label: "View All Exams", onClick: () => toast({ title: "Redirecting...", description: "Opening Data Management" }) },
        ],
      };
    }

    // Bulk edit
    if (lower.includes("bulk")) {
      return {
        text: "To bulk edit your CLEP data:\n\n1️⃣ Go to Data Management page\n2️⃣ Select multiple exams using checkboxes\n3️⃣ Click 'Bulk Edit' button\n4️⃣ Apply changes to all selected\n\nOr I can help you apply changes to specific categories. What would you like to update?",
        actions: [
          {
            label: "Set all to score 50",
            onClick: () => {
              toast({ title: "✅ Updated!", description: "All exams set to minimum score 50" });
            },
          },
          { label: "Go to Data Management", onClick: () => {} },
        ],
      };
    }

    // CLEP scoring
    if (lower.includes("scor")) {
      return {
        text: "Great question! CLEP scoring basics:\n\n📊 Score Range: 20-80\n📈 Common Minimums:\n• 50 = Most lenient (~82% pass)\n• 55 = Moderate (~70% pass)\n• 60 = Selective (~55% pass)\n\n🎯 Average across institutions: 52\n\nYour current average: 53\n\nWould you like to see how you compare to similar institutions?",
        actions: [
          { label: "Compare to Peers", onClick: () => toast({ title: "Feature coming soon" }) },
          { label: "See My Scores", onClick: () => handleQuickAction("view") },
        ],
      };
    }

    // Default response
    return {
      text: "I can help you with:\n\n• Updating exam scores and credits\n• Viewing your CLEP acceptance data\n• Bulk editing multiple exams\n• Understanding CLEP scoring\n• Finding specific exam information\n\nWhat would you like to know more about?",
      actions: [
        { label: "Update an exam", onClick: () => handleQuickAction("update") },
        { label: "View my data", onClick: () => handleQuickAction("view") },
      ],
    };
  };
  */
  

  const handleSend = async (customMessage?: string) => {
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    // Display USER message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // If we are waiting for confirmation
    if (pendingActions) {
      const answer = messageText.toLowerCase();

      if (answer.includes("yes") || answer.includes("confirm") || answer.includes("apply")) {
        // User confirmed -> commit updates
        try {
          const institutionId = user?.institution?.id;
          if (!institutionId) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              text: "❌ Error: You must be logged in as an institution to update data.",
              sender: "ai",
              timestamp: new Date()
            }]);
            setIsLoading(false);
            return;
          }

          const { handleConfirmUpdate } = await import("@/pages/api/confirm-update");
          const data = await handleConfirmUpdate(pendingActions, institutionId);

          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.reply,
            sender: "ai",
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, aiMessage]);
          setPendingActions(null); // reset state
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Confirm update error:", err);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "❌ Failed to update. Please try again.",
            sender: "ai",
            timestamp: new Date()
          }]);
          setIsLoading(false);
          return;
        }
      }

      if (answer.includes("no") || answer.includes("cancel") || answer.includes("abort")) {
        // Cancel update
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          text: "Okay, I cancelled the update. What would you like to do instead?",
          sender: "ai",
          timestamp: new Date()
        }]);
        setPendingActions(null);
        setIsLoading(false);
        return;
      }
    }

    // Normal processing: check if it's an informational query or update command
    const lowerMessage = messageText.toLowerCase();
    const isUpdateCommand = 
      lowerMessage.includes("set") || 
      lowerMessage.includes("change") || 
      lowerMessage.includes("update") || 
      lowerMessage.includes("modify") ||
      lowerMessage.includes("edit") ||
      (lowerMessage.includes("to") && (lowerMessage.includes("score") || lowerMessage.includes("credit") || lowerMessage.includes("course")));

    // Handle informational queries first
    if (!isUpdateCommand) {
      try {
        const institutionId = user?.institution?.id || 0;
        const { handleInformationalQuery } = await import("@/pages/api/institution-chat");
        const reply = handleInformationalQuery(messageText, institutionId);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: reply,
          sender: "ai",
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("Informational query error:", error);
      }
    }

    // Handle update commands
    try {
      const { handleUpdateIntent } = await import("@/pages/api/update-college-intent");
      const data = await handleUpdateIntent(messageText);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // If Claude returned actions, save them
      if (data.actions && data.actions.length > 0) {
        setPendingActions(data.actions);
      }

    } catch (error) {
      console.error("Update intent error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: "Sorry, something went wrong. Please try again or rephrase your request.",
        sender: "ai",
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[400px] bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">CLEP Assistant</h3>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === "ai"
                    ? "bg-gradient-to-br from-primary to-secondary"
                    : "bg-accent"
                }`}
              >
                {message.sender === "ai" ? (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <User className="h-4 w-4 text-accent-foreground" />
                )}
              </div>
              <div
                className={`flex-1 max-w-[80%] ${
                  message.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <Card
                  className={`p-3 ${
                    message.sender === "ai"
                      ? "bg-card text-foreground"
                      : "bg-primary/10 text-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.actions.map((action, idx) => (
                        <Button
                          key={idx}
                          size="sm"
                          variant="outline"
                          onClick={action.onClick}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </Card>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <Card className="p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button onClick={() => handleSend()} disabled={!input.trim() || isLoading} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send
          </p>
        </div>
      </div>
    </>
  );
};
