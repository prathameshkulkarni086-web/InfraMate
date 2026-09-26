import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Building2,
  DollarSign,
  Boxes,
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  HardHat,
  BarChart3,
  AlertTriangle,
} from "lucide-react";
import { Project, Material, Expense, Worker, ProgressLog, Task } from "../../types";
import { aiService } from "../../services/aiService";

interface AIAssistantViewProps {
  project: Project;
  materials: Material[];
  expenses: Expense[];
  labor: Worker[];
  progressLogs: ProgressLog[];
  tasks: Task[];
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  project,
  materials = [],
  expenses = [],
  labor = [],
  progressLogs = [],
  tasks = [],
}) => {
  const safeMaterials = Array.isArray(materials) ? materials : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeLabor = Array.isArray(labor) ? labor : [];
  const safeProgressLogs = Array.isArray(progressLogs) ? progressLogs : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const totalSpent = safeExpenses.reduce((s, e) => s + (e?.amount || 0), 0);
  const totalBudget = project?.budget || 0;
  const lowStockCount = safeMaterials.filter((m) => m && m.quantity <= m.minimumStock).length;

  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; timestamp: string }[]
  >([
    {
      role: "assistant",
      content: `### Active Project Telemetry: **${project?.name || "Selected Project"}**

| Metric | Value | Threshold / Target |
| :--- | :--- | :--- |
| **Total Budget** | **₹${totalBudget.toLocaleString()}** | Approved Scope |
| **Spent to Date** | **₹${totalSpent.toLocaleString()}** | ${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of Budget |
| **Remaining Liquidity** | **₹${(totalBudget - totalSpent).toLocaleString()}** | ${totalBudget >= totalSpent ? "Within Budget" : "Overrun"} |
| **Physical Progress** | **${project?.progressPercentage || 0}%** | Target ${project?.targetProgress || 50}% |
| **Monitored Inventory** | **${safeMaterials.length} SKUs** | ${lowStockCount} Low-Stock Alerts |
| **Active Labor** | **${safeLabor.length} Workers** | On-site roster |

Ask any query regarding financial breakdowns, low-stock reorder quantities, labor wage liabilities, or task scheduling.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestedPrompts = [
    "What are our top expense categories and remaining budget?",
    "Which materials are near or below the safety reorder threshold?",
    "Provide a workforce breakdown by trade and daily wage expense.",
    "Summarize critical path tasks and milestone status.",
  ];

  const handleSend = async (queryToSend?: string) => {
    const text = queryToSend || inputQuery;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      role: "user" as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const responseText = await aiService.askAssistant(
        text,
        {
          project,
          materials: safeMaterials,
          expenses: safeExpenses,
          labor: safeLabor,
          progress: safeProgressLogs,
          tasks: safeTasks,
        },
        messages.map((m) => ({ role: m.role, content: m.content }))
      );

      const assistantMsg = {
        role: "assistant" as const,
        content: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "### ⚠️ Query Processing Error\n\nCould not process the query against the active project context. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden animate-in fade-in">
      {/* Assistant Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">AI Construction Assistant</h2>
              <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
                <Sparkles className="h-2.5 w-2.5 text-blue-600" /> Gemini Grounded
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Active Context: <span className="text-blue-600 font-semibold">{project?.name || "No Project"}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: "assistant",
                content: `### Telemetry Reset for **${project?.name || "Active Project"}**\n\nDirect telemetry query engine ready. Ask about financial metrics, inventory alerts, labor logs, or task schedules.`,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            ])
          }
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-xs transition"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-3xl ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                m.role === "user"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-600 border border-blue-200"
              }`}
            >
              {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>

            <div
              className={`relative rounded-2xl p-4 text-xs leading-relaxed shadow-xs group ${
                m.role === "user"
                  ? "bg-blue-600 text-white font-medium"
                  : "border border-slate-200 bg-slate-50 text-slate-800"
              }`}
            >
              {/* Copy button for assistant responses */}
              {m.role === "assistant" && (
                <button
                  onClick={() => handleCopy(m.content, idx)}
                  className="absolute top-2 right-2 p-1 rounded bg-white border border-slate-200 text-slate-500 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition shadow-xs"
                  title="Copy text"
                >
                  {copiedIndex === idx ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}

              {/* Render formatting */}
              {m.role === "user" ? (
                <div className="whitespace-pre-wrap">{m.content}</div>
              ) : (
                <div className="markdown-content space-y-3 overflow-x-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({ children }) => <h1 className="text-base font-bold text-slate-900 mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-bold text-slate-800 mb-1.5">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-xs font-semibold text-slate-700 mb-1">{children}</h4>,
                      p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-700">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 text-slate-700">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 text-slate-700">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse bg-white">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-800 font-bold">{children}</thead>,
                      tbody: ({ children }) => <tbody className="divide-y divide-slate-100">{children}</tbody>,
                      tr: ({ children }) => <tr className="hover:bg-slate-50/60 transition-colors">{children}</tr>,
                      th: ({ children }) => <th className="py-2 px-3 text-[11px] font-bold text-slate-700 uppercase tracking-wider">{children}</th>,
                      td: ({ children }) => <td className="py-2 px-3 text-xs text-slate-700">{children}</td>,
                      code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-slate-200/70 font-mono text-[11px] text-blue-800">{children}</code>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              )}

              <div
                className={`mt-2 text-[9px] font-mono text-right ${
                  m.role === "user" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-blue-700 flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-blue-600" />
              <span>Querying live project data and performing calculations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Tray */}
      <div className="border-t border-slate-200 bg-slate-50/70 p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 whitespace-nowrap hover:border-blue-300 hover:text-blue-600 transition text-left shadow-xs"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Ask anything (e.g., 'What are top expense categories?', 'Remaining budget', 'Low stock materials')..."
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuery.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
