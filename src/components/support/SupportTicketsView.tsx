import React, { useState } from "react";
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  User as UserIcon,
  Bot,
  ShieldCheck,
  Building2,
  Plus,
  Receipt,
  RotateCcw,
  Sparkles,
  Phone,
  Eye,
  ExternalLink,
} from "lucide-react";
import { SupportTicket, TicketStatus, TicketPriority, User, Project } from "../../types";
import { supportService } from "../../services/supportService";

interface SupportTicketsViewProps {
  tickets: SupportTicket[];
  currentUser: User;
  projects: Project[];
  onRaiseTicket: () => void;
  onViewTransaction?: (transactionId: string) => void;
  onViewReturn?: (returnId: string) => void;
  onAskAI?: (query: string) => void;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({
  tickets,
  currentUser,
  projects,
  onRaiseTicket,
  onViewTransaction,
  onViewReturn,
  onAskAI,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [replyText, setReplyText] = useState<string>("");

  const isContractor =
    currentUser.role === "contractor" ||
    currentUser.role === "project_manager" ||
    currentUser.role === "admin";

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    supportService.addTicketMessage(activeTicket.id, {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType: isContractor ? "contractor" : "user",
      senderRole: currentUser.role,
      message: replyText.trim(),
    });

    setReplyText("");
  };

  const handleResolveTicket = () => {
    if (!activeTicket) return;
    supportService.resolveTicket(activeTicket.id, currentUser.name);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "Resolved":
      case "Closed":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> {status}</span>;
      case "Waiting for Contractor":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit"><AlertTriangle className="w-3.5 h-3.5" /> Escalated to Contractor</span>;
      case "Contractor Responded":
      case "AI Handling":
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 w-fit"><Clock className="w-3.5 h-3.5" /> {status}</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case "Urgent":
        return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-rose-600 text-white uppercase">Urgent</span>;
      case "High":
        return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-amber-500 text-white uppercase">High</span>;
      case "Medium":
        return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-blue-500 text-white uppercase">Med</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-extrabold rounded bg-slate-400 text-white uppercase">Low</span>;
    }
  };

  return (
    <div id="support-tickets-view" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Support & Contractor Escalations</h3>
          <p className="text-xs text-slate-500">
            {isContractor
              ? "Contractor & PM management inbox for resolving escalated inquiries and site disputes."
              : "Track questions, return requests, and contractor responses in real time."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRaiseTicket}
            className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Raise Support Ticket
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Ticket List + Live Conversation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tickets Master List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Filter Toolbar */}
          <div className="flex items-center justify-between gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium w-1/2"
            >
              <option value="all">All Statuses ({tickets.length})</option>
              <option value="Waiting for Contractor">Waiting for Contractor</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium w-1/2"
            >
              <option value="all">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* List items */}
          <div className="space-y-3 max-h-[660px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <LifeBuoy className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">No tickets match criteria</p>
              </div>
            ) : (
              filteredTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    activeTicket?.id === t.id
                      ? "bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/20 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">{t.ticketNumber}</span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  <h4 className="font-bold text-sm text-slate-800 mt-2 line-clamp-1">{t.subject}</h4>

                  <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
                    <span className="truncate max-w-[140px] font-medium text-slate-700">{t.userName}</span>
                    <span>{new Date(t.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Details Drawer */}
        <div className="lg:col-span-7">
          {activeTicket ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[720px] overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{activeTicket.ticketNumber}</span>
                      {getStatusBadge(activeTicket.status)}
                      {getPriorityBadge(activeTicket.priority)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{activeTicket.subject}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Raised by <strong>{activeTicket.userName}</strong> ({activeTicket.userRole}) for <strong>{activeTicket.projectName}</strong>
                    </p>
                  </div>

                  {activeTicket.status !== "Resolved" && (
                    <button
                      onClick={handleResolveTicket}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}
                </div>

                {/* Linked References & Assigned Contractor */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                  {activeTicket.relatedTransactionNumber && onViewTransaction && (
                    <button
                      onClick={() => onViewTransaction(activeTicket.relatedTransactionNumber!)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"
                    >
                      <Receipt className="w-3 h-3" /> TXN: {activeTicket.relatedTransactionNumber}
                    </button>
                  )}

                  {activeTicket.relatedReturnNumber && onViewReturn && (
                    <button
                      onClick={() => onViewReturn(activeTicket.relatedReturnNumber!)}
                      className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg hover:bg-amber-100 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> RET: {activeTicket.relatedReturnNumber}
                    </button>
                  )}

                  <div className="ml-auto text-slate-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Contractor: <strong>{activeTicket.contractorName || "Gurpreet Singh"}</strong></span>
                  </div>
                </div>
              </div>

              {/* AI Escalation Briefing (if present) */}
              {activeTicket.aiEscalationSummary && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/80 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-950 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>AI Assistant Executive Escalation Summary</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                    <div>
                      <span className="font-semibold text-slate-900 block">Identified Site Issue:</span>
                      <span>{activeTicket.aiEscalationSummary.issue}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 block">Recommended Action:</span>
                      <span>{activeTicket.aiEscalationSummary.recommendedAction || "Inspect on-site and authorize replacement"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Thread */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto bg-slate-50/40">
                {activeTicket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      msg.senderId === currentUser.id ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                        msg.senderType === "ai"
                          ? "bg-slate-900 text-cyan-400"
                          : msg.senderType === "contractor"
                          ? "bg-amber-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {msg.senderType === "ai" ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm ${
                        msg.senderId === currentUser.id
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[11px] mb-1 opacity-80">
                        <span className="font-bold">{msg.senderName} ({msg.senderRole})</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isContractor
                        ? "Respond to user with contractor instructions, site update, or dispatch notes..."
                        : "Type your reply to contractor..."
                    }
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <LifeBuoy className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-slate-600">Select a ticket from the left</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
