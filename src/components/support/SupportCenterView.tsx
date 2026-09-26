import React, { useState, useEffect } from "react";
import {
  LifeBuoy,
  Bot,
  Receipt,
  RotateCcw,
  MessageSquare,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";
import {
  User,
  Project,
  Transaction,
  ReturnRequest,
  RefundRecord,
  SupportTicket,
} from "../../types";
import { supportService } from "../../services/supportService";
import { AIChatSupportTab } from "./AIChatSupportTab";
import { TransactionHistoryTable } from "./TransactionHistoryTable";
import { ReturnsAndRefundsView } from "./ReturnsAndRefundsView";
import { SupportTicketsView } from "./SupportTicketsView";
import { WhatsAppSupportView } from "./WhatsAppSupportView";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { ReturnRequestModal } from "./ReturnRequestModal";
import { RaiseTicketModal } from "./RaiseTicketModal";

interface SupportCenterViewProps {
  currentUser: User;
  projects: Project[];
  activeProject?: Project;
}

export const SupportCenterView: React.FC<SupportCenterViewProps> = ({
  currentUser,
  projects,
  activeProject,
}) => {
  const [activeTab, setActiveTab] = useState<
    "ai_chat" | "transactions" | "returns" | "tickets" | "whatsapp"
  >("ai_chat");

  const [transactions, setTransactions] = useState<Transaction[]>(
    supportService.getTransactions()
  );
  const [returns, setReturns] = useState<ReturnRequest[]>(
    supportService.getReturns()
  );
  const [refunds, setRefunds] = useState<RefundRecord[]>(
    supportService.getRefunds()
  );
  const [tickets, setTickets] = useState<SupportTicket[]>(
    supportService.getTickets()
  );

  // Modals state
  const [selectedTxnForDetails, setSelectedTxnForDetails] =
    useState<Transaction | null>(null);
  const [selectedTxnForReturn, setSelectedTxnForReturn] =
    useState<Transaction | null>(null);
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [showRaiseTicketModal, setShowRaiseTicketModal] =
    useState<boolean>(false);
  const [prefilledTicketTxnId, setPrefilledTicketTxnId] = useState<
    string | undefined
  >();
  const [prefilledTicketRetId, setPrefilledTicketRetId] = useState<
    string | undefined
  >();

  // Reload data when storage updates
  useEffect(() => {
    const handleUpdate = () => {
      setTransactions(supportService.getTransactions());
      setReturns(supportService.getReturns());
      setRefunds(supportService.getRefunds());
      setTickets(supportService.getTickets());
    };

    window.addEventListener("infrasync_storage_update", handleUpdate);
    return () => window.removeEventListener("infrasync_storage_update", handleUpdate);
  }, []);

  // Summary KPIs
  const openQueriesCount = tickets.filter(
    (t) => t.status !== "Resolved" && t.status !== "Closed"
  ).length;
  const aiResolvedCount = tickets.filter(
    (t) => t.status === "Resolved" && !t.contractorId
  ).length + 18; // plus automated instant chat queries
  const contractorEscalationsCount = tickets.filter(
    (t) =>
      t.status === "Waiting for Contractor" ||
      t.status === "Contractor Responded" ||
      Boolean(t.contractorId)
  ).length;
  const totalRefundAmount = refunds.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const handleOpenTransactionDetails = (txn: Transaction) => {
    setSelectedTxnForDetails(txn);
  };

  const handleOpenTransactionById = (txnId: string) => {
    const found = transactions.find(
      (t) => t.id.toLowerCase() === txnId.toLowerCase()
    );
    if (found) {
      setSelectedTxnForDetails(found);
    } else {
      setActiveTab("transactions");
    }
  };

  const handleOpenReturnModal = (txn?: Transaction) => {
    setSelectedTxnForReturn(txn || null);
    setShowReturnModal(true);
  };

  const handleOpenRaiseTicket = (txnId?: string, retId?: string) => {
    setPrefilledTicketTxnId(txnId);
    setPrefilledTicketRetId(retId);
    setShowRaiseTicketModal(true);
  };

  const handleAskAIQuery = (query: string) => {
    setActiveTab("ai_chat");
  };

  return (
    <div id="support-center-module" className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              24/7 Support & Transaction Center
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300">
            Ground-truth transaction ledger, AI assistance, automated material returns, and direct contractor escalations.
          </p>
        </div>

        {/* Quick Action CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenReturnModal()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Raise Return Request
          </button>
          <button
            onClick={() => handleOpenRaiseTicket()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Raise Support Ticket
          </button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Queries */}
        <div
          onClick={() => setActiveTab("tickets")}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Open Queries
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {openQueriesCount}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across active construction sites
          </span>
        </div>

        {/* AI Resolved Queries */}
        <div
          onClick={() => setActiveTab("ai_chat")}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-cyan-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              AI Resolved Queries
            </span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl group-hover:bg-cyan-100 transition-colors">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-cyan-700 mt-2">
            {aiResolvedCount}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> 94.8% First-turn accuracy
          </span>
        </div>

        {/* Contractor Escalations */}
        <div
          onClick={() => setActiveTab("tickets")}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Contractor Escalations
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {contractorEscalationsCount}
          </div>
          <span className="text-xs text-amber-800 mt-1 block">
            Assigned to Gurpreet Singh
          </span>
        </div>

        {/* Returns & Total Refunded */}
        <div
          onClick={() => setActiveTab("returns")}
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Processed Refunds
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            ₹{totalRefundAmount.toLocaleString("en-IN")}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {returns.length} total return requests
          </span>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab("ai_chat")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "ai_chat"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-600" />
          <span>24/7 AI Support</span>
          <span className="px-1.5 py-0.2 bg-cyan-100 text-cyan-800 text-[10px] rounded-full font-bold">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "transactions"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Receipt className="w-4 h-4 text-blue-600" />
          <span>Transaction History</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded-full font-bold">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("returns")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "returns"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>Returns & Refunds</span>
          {returns.some((r) => r.status === "Under Review" || r.status === "Return Requested") && (
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "tickets"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LifeBuoy className="w-4 h-4 text-indigo-600" />
          <span>Support Tickets & Contractor Desk</span>
          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 text-[10px] rounded-full font-bold">
            {openQueriesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("whatsapp")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "whatsapp"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Phone className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp Support</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "ai_chat" && (
        <AIChatSupportTab
          currentUser={currentUser}
          projects={projects}
          activeProject={activeProject}
          transactions={transactions}
          returns={returns}
          refunds={refunds}
          tickets={tickets}
          onViewTransaction={handleOpenTransactionById}
          onRequestReturn={handleOpenReturnModal}
          onViewTicket={() => setActiveTab("tickets")}
        />
      )}

      {activeTab === "transactions" && (
        <TransactionHistoryTable
          transactions={transactions}
          projects={projects}
          currentUser={currentUser}
          onViewDetails={handleOpenTransactionDetails}
          onRequestReturn={handleOpenReturnModal}
          onNewTransaction={() => handleOpenReturnModal()}
          onAskAI={handleAskAIQuery}
        />
      )}

      {activeTab === "returns" && (
        <ReturnsAndRefundsView
          returns={returns}
          refunds={refunds}
          currentUser={currentUser}
          projects={projects}
          onNewReturn={() => handleOpenReturnModal()}
          onAskAI={handleAskAIQuery}
        />
      )}

      {activeTab === "tickets" && (
        <SupportTicketsView
          tickets={tickets}
          currentUser={currentUser}
          projects={projects}
          onRaiseTicket={() => handleOpenRaiseTicket()}
          onViewTransaction={handleOpenTransactionById}
          onViewReturn={() => setActiveTab("returns")}
          onAskAI={handleAskAIQuery}
        />
      )}

      {activeTab === "whatsapp" && (
        <WhatsAppSupportView
          currentUser={currentUser}
          projects={projects}
          activeProject={activeProject}
          transactions={transactions}
          onAskAI={handleAskAIQuery}
        />
      )}

      {/* Transaction Details Modal */}
      {selectedTxnForDetails && (
        <TransactionDetailsModal
          transaction={selectedTxnForDetails}
          onClose={() => setSelectedTxnForDetails(null)}
          onRequestReturn={(t) => {
            setSelectedTxnForDetails(null);
            handleOpenReturnModal(t);
          }}
          onAskAI={handleAskAIQuery}
        />
      )}

      {/* Return Request Modal */}
      {showReturnModal && (
        <ReturnRequestModal
          transaction={selectedTxnForReturn}
          transactions={transactions}
          currentUser={currentUser}
          onClose={() => {
            setShowReturnModal(false);
            setSelectedTxnForReturn(null);
          }}
          onSuccess={(returnId) => {
            setShowReturnModal(false);
            setSelectedTxnForReturn(null);
            setActiveTab("returns");
          }}
        />
      )}

      {/* Raise Support Ticket Modal */}
      {showRaiseTicketModal && (
        <RaiseTicketModal
          currentUser={currentUser}
          projects={projects}
          activeProject={activeProject}
          transactions={transactions}
          returns={returns}
          prefilledTransactionId={prefilledTicketTxnId}
          prefilledReturnId={prefilledTicketRetId}
          onClose={() => {
            setShowRaiseTicketModal(false);
            setPrefilledTicketTxnId(undefined);
            setPrefilledTicketRetId(undefined);
          }}
          onSuccess={(ticketId) => {
            setShowRaiseTicketModal(false);
            setPrefilledTicketTxnId(undefined);
            setPrefilledTicketRetId(undefined);
            setActiveTab("tickets");
          }}
        />
      )}
    </div>
  );
};
