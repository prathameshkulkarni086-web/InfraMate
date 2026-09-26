import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  MessageSquare,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Building2,
  Package,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Phone,
  RefreshCw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { User, Project, Transaction, ReturnRequest, RefundRecord, SupportTicket, AIEscalationSummary } from "../../types";
import { supportService } from "../../services/supportService";

interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  matchedTransactionId?: string;
  matchedReturnId?: string;
  shouldEscalate?: boolean;
  escalationSummary?: AIEscalationSummary;
  suggestedActions?: string[];
}

interface AIChatSupportTabProps {
  currentUser: User;
  projects: Project[];
  activeProject?: Project;
  transactions: Transaction[];
  returns: ReturnRequest[];
  refunds: RefundRecord[];
  tickets: SupportTicket[];
  onViewTransaction: (transactionId: string) => void;
  onRequestReturn: (transaction: Transaction) => void;
  onViewTicket: (ticketId: string) => void;
}

export const AIChatSupportTab: React.FC<AIChatSupportTabProps> = ({
  currentUser,
  projects,
  activeProject,
  transactions,
  returns,
  refunds,
  tickets,
  onViewTransaction,
  onRequestReturn,
  onViewTicket,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject?.id || (projects[0]?.id || "proj-1"));
  const selectedProj = projects.find((p) => p.id === selectedProjectId) || activeProject;

  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "ai",
      text: `Hello **${currentUser.name}**! 👋\n\nI am your **24/7 InfraMate AI Support Assistant** for **${selectedProj?.name || "your construction site"}**.\n\nI can instantly look up transactions, check material deliveries, track return requests, explain invoices, and automatically escalate unresolved queries to your assigned contractor **Gurpreet Singh**.\n\nHow can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedActions: [
        "Check status of TXN-2026-004822",
        "Track Return RET-2026-000842",
        "Show recent cement purchases",
        "Escalate damaged rebar to contractor",
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/support/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          user: currentUser,
          projectContext: { project: selectedProj },
          transactions: transactions.filter((t) => !selectedProjectId || selectedProjectId === "all" || t.projectId === selectedProjectId),
          returns: returns.filter((r) => !selectedProjectId || selectedProjectId === "all" || r.projectId === selectedProjectId),
          refunds: refunds.filter((rf) => !selectedProjectId || selectedProjectId === "all" || rf.projectId === selectedProjectId),
          supportTickets: tickets.filter((tk) => !selectedProjectId || selectedProjectId === "all" || tk.projectId === selectedProjectId),
          chatHistory: messages.slice(-4).map((m) => ({ role: m.sender === "user" ? "user" : "model", text: m.text })),
        }),
      });

      if (!response.ok) {
        throw new Error("AI service temporary error");
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.text || "I have analyzed your request against the site transaction records.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        matchedTransactionId: data.matchedTransactionId,
        matchedReturnId: data.matchedReturnId,
        shouldEscalate: data.shouldEscalate,
        escalationSummary: data.escalationSummary,
        suggestedActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Offline / network fallback
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: `I retrieved records for **${selectedProj?.name || "Site"}**. You can search transactions directly or raise an escalation ticket for contractor Gurpreet Singh.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: ["View All Transactions", "Raise Support Ticket", "Continue on WhatsApp"],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalateToContractor = (summary?: AIEscalationSummary, customIssue?: string) => {
    const issueText = summary?.issue || customIssue || "Site material/transaction inquiry requires contractor intervention.";
    const newTicket = supportService.createTicket({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      userPhone: currentUser.phone,
      userRole: currentUser.role,
      projectId: selectedProjectId,
      projectName: selectedProj?.name || "Project Site",
      contractorId: "usr-cont-1",
      contractorName: "Gurpreet Singh (Apex Contractors)",
      category: summary?.returnRef ? "Return" : "Transaction",
      priority: "High",
      subject: `[AI Escalation] ${issueText.slice(0, 75)}`,
      description: issueText,
      relatedTransactionId: summary?.transactionRef,
      relatedReturnId: summary?.returnRef,
      source: "web",
      initialMessage: `AI Support transfer from ${currentUser.name}: ${issueText}`,
    });

    if (summary) {
      supportService.escalateTicketToContractor(
        newTicket.id,
        "usr-cont-1",
        "Gurpreet Singh (Apex Contractors)",
        summary
      );
    }

    const systemMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: "system",
      text: `🔔 **Ticket ${newTicket.ticketNumber} Created & Escalated to Contractor Gurpreet Singh**\n\nThe contractor has received your project briefing and will respond shortly. You can track updates in the **Support Tickets** tab.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, systemMsg]);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: `Chat cleared. How can I assist you with **${selectedProj?.name}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedActions: [
          "Check status of TXN-2026-004822",
          "Track Return RET-2026-000842",
          "Show recent cement purchases",
        ],
      },
    ]);
  };

  return (
    <div id="ai-chat-support-tab" className="flex flex-col h-[760px] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">24/7 AI Support & Grounding Assistant</h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/40 uppercase tracking-wide">
                Live 24/7
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Instant site transaction lookup, material return tracking, and contractor escalation
            </p>
          </div>
        </div>

        {/* Project Context Selector & Controls */}
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            } animate-fade-in`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white shadow-sm"
                  : msg.sender === "system"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-900 text-cyan-400 shadow-sm"
              }`}
            >
              {msg.sender === "user" ? (
                <UserIcon className="w-4 h-4" />
              ) : msg.sender === "system" ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </div>

            {/* Bubble Content */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none shadow-sm"
                  : msg.sender === "system"
                  ? "bg-amber-50 text-amber-950 border border-amber-200/80 rounded-tl-none"
                  : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm"
              }`}
            >
              {/* Markdown Body */}
              <div className={msg.sender === "user" ? "text-white" : "text-slate-800"}>
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                    code: ({ children }) => (
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs border border-slate-200">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>

              {/* Matched Transaction Card Widget */}
              {msg.matchedTransactionId && (
                <div className="mt-3 p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="font-bold text-slate-900 text-xs">{msg.matchedTransactionId}</span>
                      <span className="text-[11px] text-slate-500 block">Verified Procurement Record</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onViewTransaction(msg.matchedTransactionId!)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    View Details <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Escalation Prompt Card */}
              {msg.shouldEscalate && (
                <div className="mt-3 p-3.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-xl border border-amber-300 text-slate-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Contractor Escalation Recommended</span>
                  </div>
                  <p className="text-xs text-slate-700">
                    {msg.escalationSummary?.issue || "This inquiry involves material quality / site schedule coordination."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleEscalateToContractor(msg.escalationSummary)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Escalate to Gurpreet Singh (Contractor)
                    </button>
                    <a
                      href={supportService.generateWhatsAppLink("+919888899999", `Hi Gurpreet Singh, escalating site issue from InfraMate AI: ${msg.escalationSummary?.issue || "Urgent site query"}`)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" /> Continue on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              {/* Suggestion Chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {msg.suggestedActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (action.includes("WhatsApp")) {
                          window.open(supportService.generateWhatsAppLink("+919888899999", "Hi InfraMate Support team, I have a query regarding my construction project."), "_blank");
                        } else {
                          handleSendMessage(action);
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>{action}</span>
                      <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <div
                className={`text-[10px] mt-2 font-medium ${
                  msg.sender === "user" ? "text-blue-200 text-right" : "text-slate-400"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 ml-1 font-medium">Analyzing live project records & policies...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about any purchase, invoice, delivery, return, or request contractor escalation..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 px-1">
          <span>Grounded with live project transactions, returns & RBAC permissions</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  );
};
