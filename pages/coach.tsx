import { useState, useRef, useEffect } from "react";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, Zap, AlertCircle, ChevronRight, RefreshCw, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetMe } from "@workspace/api-client-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  starter_step?: { text: string; minutes: number };
  clarifying_questions?: string[];
};

const WELCOME: Message = {
  role: "assistant",
  content: "Hey there! I'm your FOCUSMATE Coach. I'm here to help you stop procrastinating and actually get things done. 💪\n\nWhat's on your mind? Tell me what you're struggling to start, or what's been blocking you.",
  suggestions: ["I can't seem to start my assignment", "I have too many tasks and feel overwhelmed", "I keep getting distracted"],
};

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { data: me } = useGetMe({ query: { queryKey: ["/api/auth/me"] } });
  const token = localStorage.getItem("procrastistop_token");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "");
      const res = await fetch(`${baseUrl}/api/coach/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg, conversation_id: conversationId }),
      });

      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      setConversationId(data.conversation_id);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply.text,
        suggestions: data.reply.suggestions,
        starter_step: data.reply.starter_step,
        clarifying_questions: data.reply.clarifying_questions,
      }]);
    } catch {
      toast({ title: "Coach unavailable", description: "Try again in a moment", variant: "destructive" });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm having trouble responding right now. Let me try again shortly — you've got this!",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setConversationId(null);
    setInput("");
  };

  return (
    <Layout>
      <div className="flex flex-col h-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              FOCUSMATE Coach
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">AI-powered procrastination coach • Productivity only, not medical advice</p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetChat} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-card-border text-foreground rounded-bl-sm"
                }`}>
                  {msg.content.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>

                {msg.role === "assistant" && msg.starter_step && (
                  <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-xs font-semibold text-primary mb-1">5-minute starter step</p>
                    <p className="text-sm text-foreground">{msg.starter_step.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{msg.starter_step.minutes} min</p>
                  </div>
                )}

                {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {msg.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border text-muted-foreground transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {msg.role === "assistant" && msg.clarifying_questions && msg.clarifying_questions.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.clarifying_questions.map((q, j) => (
                      <button
                        key={j}
                        onClick={() => sendMessage(q)}
                        className="flex items-center gap-2 w-full text-left text-xs text-muted-foreground hover:text-foreground group transition-colors"
                      >
                        <ChevronRight className="w-3 h-3 flex-shrink-0 group-hover:text-primary" />
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2.5">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-card border border-card-border rounded-2xl rounded-bl-sm px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              data-testid="input-coach-message"
              placeholder="Tell me what's blocking you..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              data-testid="button-send-coach"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-11 w-11 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Productivity coaching only — not medical or therapy advice
          </p>
        </div>
      </div>
    </Layout>
  );
}
