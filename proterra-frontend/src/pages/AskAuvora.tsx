import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAI, getAISuggestions } from "@/lib/api";
import { Bot, Send, User, Lightbulb, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AskAuvora() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAISuggestions()
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const question = text || input;
    if (!question.trim()) return;

    const userMsg: Message = { role: "user", content: question, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await askAI(question);
      const assistantMsg: Message = {
        role: "assistant",
        content: data.answer || data.response || "I apologize, I couldn't generate a response.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Bot className="h-8 w-8 text-sky-600" />
          Ask Auvora AI
        </h1>
        <p className="text-zinc-500 mt-1">
          Your AI assistant for ProTerra Design — ask about projects, leads, bids, and business insights
        </p>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Bot className="h-16 w-16 text-sky-200 mb-4" />
              <h2 className="text-lg font-semibold text-zinc-700">Hello! I'm Auvora AI</h2>
              <p className="text-sm text-zinc-400 max-w-md mt-2">
                I can help you with insights about your outdoor design projects, lead pipeline,
                contractor bids, and business analytics. Try one of the suggestions below!
              </p>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s)}
                      className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:border-sky-300 transition-colors"
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 flex-shrink-0">
                  <Bot className="h-4 w-4 text-sky-600" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-lg px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-900"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-50 mt-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 flex-shrink-0">
                  <User className="h-4 w-4 text-zinc-600" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 flex-shrink-0">
                <Bot className="h-4 w-4 text-sky-600" />
              </div>
              <div className="bg-zinc-100 rounded-lg px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about projects, leads, bids, or business insights..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
