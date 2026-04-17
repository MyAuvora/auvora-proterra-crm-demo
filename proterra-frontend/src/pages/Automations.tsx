import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getAutomations,
  deleteAutomation,
  toggleAutomation,
  aiCreateAutomation,
  getAutomationSuggestions,
  getAutomationLogs,
} from "@/lib/api";
import {
  Zap,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Bot,
  Send,
  Loader2,
  Activity,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

interface Automation {
  automation_id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, string>;
  conditions: Array<Record<string, string>>;
  actions: Array<Record<string, string>>;
  enabled: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string | null;
}

interface AutomationLogEntry {
  log_id: string;
  trigger_event: string;
  entity_type: string;
  entity_id: string;
  actions_taken: Array<Record<string, unknown>>;
  success: boolean;
  error_message: string;
  executed_at: string | null;
}

interface Suggestion {
  prompt: string;
  description: string;
  category: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_created: "New Lead Created",
  lead_status_changed: "Lead Status Changed",
  project_status_changed: "Project Status Changed",
  bid_submitted: "Bid Submitted",
  bid_awarded: "Bid Awarded",
  bid_package_created: "Bid Package Created",
  webhook_received: "Webhook Received",
};

const TRIGGER_COLORS: Record<string, string> = {
  lead_created: "bg-emerald-100 text-emerald-700",
  lead_status_changed: "bg-blue-100 text-blue-700",
  project_status_changed: "bg-purple-100 text-purple-700",
  bid_submitted: "bg-amber-100 text-amber-700",
  bid_awarded: "bg-green-100 text-green-700",
  bid_package_created: "bg-orange-100 text-orange-700",
  webhook_received: "bg-slate-100 text-slate-700",
};

const CATEGORY_ICONS: Record<string, string> = {
  lead_management: "👤",
  reporting: "📊",
  project_tracking: "📋",
  bidding: "💰",
  project_setup: "🏗️",
};

export default function Automations() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<AutomationLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const loadData = async () => {
    try {
      const [autoData, sugData] = await Promise.all([
        getAutomations(),
        getAutomationSuggestions().catch(() => ({ suggestions: [] })),
      ]);
      setAutomations(autoData);
      setSuggestions(sugData.suggestions || []);
    } catch (err) {
      console.error("Failed to load automations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const result = await toggleAutomation(id);
      setAutomations((prev) =>
        prev.map((a) =>
          a.automation_id === id ? { ...a, enabled: result.enabled } : a
        )
      );
    } catch (err) {
      console.error("Failed to toggle automation:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this automation?")) return;
    try {
      await deleteAutomation(id);
      setAutomations((prev) => prev.filter((a) => a.automation_id !== id));
    } catch (err) {
      console.error("Failed to delete automation:", err);
    }
  };

  const handleViewLogs = async (id: string) => {
    if (expandedLogs === id) {
      setExpandedLogs(null);
      return;
    }
    setExpandedLogs(id);
    setLogsLoading(true);
    try {
      const data = await getAutomationLogs(id);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleAICreate = async (text?: string) => {
    const prompt = text || aiInput;
    if (!prompt.trim()) return;

    setAiMessages((prev) => [...prev, { role: "user", content: prompt }]);
    setAiInput("");
    setAiLoading(true);

    try {
      const result = await aiCreateAutomation(prompt);

      if (result.status === "created") {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ **${result.automation?.name || "Automation"}** created!\n\n${result.message}`,
          },
        ]);
        loadData();
      } else if (result.status === "clarification_needed") {
        setAiMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.message },
        ]);
      } else {
        setAiMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: result.message || "Something went wrong. Please try again.",
          },
        ]);
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't create that automation. Please try again with more detail.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <Zap className="h-6 w-6" />
            </div>
            Automations
          </h1>
          <p className="text-slate-500 mt-1">
            AI-powered workflows that run your business on autopilot
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {automations.length} automation{automations.length !== 1 ? "s" : ""}
          </Badge>
          <Badge
            variant="outline"
            className="text-sm px-3 py-1 border-green-300 text-green-700"
          >
            {automations.filter((a) => a.enabled).length} active
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Creation Panel */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Create with AI
              </CardTitle>
              <p className="text-sm text-slate-500">
                Describe what you want to automate in plain English
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat messages */}
              <div className="flex-1 overflow-auto space-y-3 mb-3 max-h-60">
                {aiMessages.length === 0 && (
                  <div className="text-center py-4">
                    <Bot className="h-10 w-10 text-violet-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      Tell me what to automate...
                    </p>
                  </div>
                )}
                {aiMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`text-sm rounded-xl px-3 py-2 ${
                      msg.role === "user"
                        ? "bg-slate-800 text-white ml-4"
                        : "bg-violet-50 text-slate-700 mr-4"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
                {aiLoading && (
                  <div className="bg-violet-50 rounded-xl px-3 py-2 mr-4">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAICreate();
                }}
                className="flex gap-2"
              >
                <Input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="e.g. Notify me when a bid is submitted"
                  disabled={aiLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={aiLoading || !aiInput.trim()}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Suggestions */}
              {suggestions.length > 0 && aiMessages.length === 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Suggestions
                  </p>
                  {suggestions.slice(0, 5).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleAICreate(s.prompt)}
                      className="w-full text-left rounded-lg border border-slate-200 p-2.5 hover:border-violet-300 hover:bg-violet-50 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base">
                          {CATEGORY_ICONS[s.category] || "⚡"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 group-hover:text-violet-700 truncate">
                            {s.description}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.prompt}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-slate-300 group-hover:text-violet-500 flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Automations List */}
        <div className="lg:col-span-2 space-y-4">
          {automations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 mb-4">
                  <Zap className="h-8 w-8 text-violet-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-700">
                  No automations yet
                </h2>
                <p className="text-sm text-slate-400 mt-1 text-center max-w-sm">
                  Use the AI panel to create your first automation, or ask Auvora
                  AI to set one up for you!
                </p>
              </CardContent>
            </Card>
          ) : (
            automations.map((auto) => (
              <Card
                key={auto.automation_id}
                className={`transition-all ${
                  auto.enabled
                    ? "border-l-4 border-l-violet-500"
                    : "border-l-4 border-l-slate-300 opacity-75"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">
                          {auto.name}
                        </h3>
                        <Badge
                          className={`text-xs ${
                            TRIGGER_COLORS[auto.trigger_type] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {TRIGGER_LABELS[auto.trigger_type] ||
                            auto.trigger_type}
                        </Badge>
                        {!auto.enabled && (
                          <Badge variant="outline" className="text-xs text-slate-400">
                            Paused
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {auto.description}
                      </p>

                      {/* Trigger → Action flow */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                          {TRIGGER_LABELS[auto.trigger_type] ||
                            auto.trigger_type}
                        </span>
                        {auto.actions.map((action, idx) => (
                          <span key={idx} className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-slate-300" />
                            <span className="text-xs bg-violet-50 text-violet-600 rounded-full px-2 py-0.5">
                              {action.type === "update_field"
                                ? `Update ${action.field}`
                                : action.type === "change_status"
                                ? `Set status → ${action.value}`
                                : action.type === "create_task"
                                ? "Create task"
                                : action.type === "create_activity"
                                ? "Log activity"
                                : action.type === "invite_contractors"
                                ? "Invite contractors"
                                : action.type === "log_notification"
                                ? "Notify"
                                : action.type}
                            </span>
                          </span>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {auto.run_count} run{auto.run_count !== 1 ? "s" : ""}
                        </span>
                        {auto.last_run_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last:{" "}
                            {new Date(auto.last_run_at).toLocaleDateString()}
                          </span>
                        )}
                        {auto.created_at && (
                          <span>
                            Created{" "}
                            {new Date(auto.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewLogs(auto.automation_id)}
                        title="View logs"
                      >
                        {expandedLogs === auto.automation_id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggle(auto.automation_id)}
                        title={auto.enabled ? "Pause" : "Enable"}
                      >
                        {auto.enabled ? (
                          <Power className="h-4 w-4 text-green-500" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(auto.automation_id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Logs */}
                  {expandedLogs === auto.automation_id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-slate-600 mb-2">
                        Execution History
                      </h4>
                      {logsLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      ) : logs.length === 0 ? (
                        <p className="text-sm text-slate-400">
                          No executions yet
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-auto">
                          {logs.map((log) => (
                            <div
                              key={log.log_id}
                              className="flex items-start gap-2 text-xs"
                            >
                              {log.success ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-slate-600">
                                  {log.trigger_event} on {log.entity_type}{" "}
                                  {log.entity_id?.slice(0, 12)}
                                </span>
                                {log.error_message && (
                                  <p className="text-red-500 mt-0.5">
                                    {log.error_message}
                                  </p>
                                )}
                              </div>
                              <span className="text-slate-400 flex-shrink-0">
                                {log.executed_at
                                  ? new Date(
                                      log.executed_at
                                    ).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
