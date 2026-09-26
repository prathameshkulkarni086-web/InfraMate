import React, { useState } from "react";
import {
  Phone,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  Send,
  Sparkles,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import { User, Project, Transaction, WhatsAppMessage } from "../../types";
import { supportService } from "../../services/supportService";

interface WhatsAppSupportViewProps {
  currentUser: User;
  projects: Project[];
  activeProject?: Project;
  transactions: Transaction[];
  onAskAI?: (query: string) => void;
}

export const WhatsAppSupportView: React.FC<WhatsAppSupportViewProps> = ({
  currentUser,
  projects,
  activeProject,
  transactions,
  onAskAI,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    activeProject?.id || (projects[0]?.id || "proj-1")
  );
  const selectedProj = projects.find((p) => p.id === selectedProjectId) || activeProject;

  const [inquiryType, setInquiryType] = useState<string>("Transaction Inquiry");
  const [customNotes, setCustomNotes] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const [logs, setLogs] = useState<WhatsAppMessage[]>(supportService.getWhatsAppLogs());
  const [simText, setSimText] = useState<string>("");

  const contractorPhone = "+919888899999";
  const supportHelpline = "+918000012345";

  const defaultMessage = `*InfraMate WhatsApp Support Request*
• User: ${currentUser.name} (${currentUser.role})
• Project: ${selectedProj?.name || "Active Site"}
• Topic: ${inquiryType}
• Notes: ${customNotes || "Please review my latest site transactions & procurement status."}`;

  const waLink = supportService.generateWhatsAppLink(contractorPhone, defaultMessage);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(defaultMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateInbound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;

    supportService.logWhatsAppMessage({
      ticketId: "tkt-001",
      userId: currentUser.id,
      userName: currentUser.name,
      phone: currentUser.phone || "+919876543210",
      projectId: selectedProj?.id || "proj-1",
      projectName: selectedProj?.name || "Active Site",
      direction: "incoming",
      message: simText.trim(),
      status: "delivered",
    });

    setLogs(supportService.getWhatsAppLogs());
    setSimText("");

    // Simulate auto-bot acknowledgment
    setTimeout(() => {
      supportService.logWhatsAppMessage({
        ticketId: "tkt-001",
        userId: "system-bot",
        userName: "InfraMate Bot",
        phone: contractorPhone,
        projectId: selectedProj?.id || "proj-1",
        projectName: selectedProj?.name || "Active Site",
        direction: "outgoing",
        message: `🤖 [InfraMate WhatsApp Bot] Acknowledged! Your query "${simText.slice(0, 30)}..." has been logged under Project ${selectedProj?.name || "Site"} and routed to Contractor Gurpreet Singh.`,
        status: "delivered",
      });
      setLogs(supportService.getWhatsAppLogs());
    }, 1200);
  };

  return (
    <div id="whatsapp-support-view" className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl border border-emerald-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">InfraMate WhatsApp Business Support Hub</h3>
              <p className="text-xs text-emerald-200">
                Direct mobile messaging connected with our 24/7 AI and assigned contractor desks
              </p>
            </div>
          </div>
        </div>

        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
        >
          <Smartphone className="w-4 h-4" /> Open Official WhatsApp
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Message Generator & Pre-filled Launcher */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Configure WhatsApp Support Query</h4>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Select Target Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Inquiry Category</label>
              <select
                value={inquiryType}
                onChange={(e) => setInquiryType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
              >
                <option value="Transaction Inquiry">Transaction & Payment Verification</option>
                <option value="Material Delivery">Material Delivery Tracking</option>
                <option value="Return Request Claim">Material Defect & Return Claim</option>
                <option value="Urgent Contractor Escalation">Urgent Site Contractor Escalation</option>
                <option value="General Support">General Support & Guidance</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Specific Query / Notes</label>
              <textarea
                rows={3}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="e.g. Need confirmation on delivery date for TMT Steel lot #104."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Generated WhatsApp Message Preview */}
            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                <span>Formatted WhatsApp Payload Preview</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-2 py-0.5 text-[10px] bg-white border border-emerald-300 rounded hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied" : "Copy Text"}
                </button>
              </div>
              <pre className="text-xs text-emerald-900 whitespace-pre-wrap font-mono bg-white p-3 rounded-lg border border-emerald-100">
                {defaultMessage}
              </pre>
            </div>

            {/* Direct Connect Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a
                href={supportService.generateWhatsAppLink(contractorPhone, defaultMessage)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Phone className="w-4 h-4" /> Message Contractor (Gurpreet Singh)
              </a>
              <a
                href={supportService.generateWhatsAppLink(supportHelpline, defaultMessage)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-center transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" /> 24/7 Helpline Desk
              </a>
            </div>
          </div>
        </div>

        {/* Right: Interactive WhatsApp Webhook / Activity Stream */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[580px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-800">WhatsApp Live Activity Stream</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Webhook Sync: ACTIVE</span>
          </div>

          {/* Logs container */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/50">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  log.direction === "incoming"
                    ? "bg-white border-slate-200 text-slate-800 ml-6"
                    : "bg-emerald-50 border-emerald-200 text-emerald-950 mr-6"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 mb-1">
                  <span>{log.direction === "incoming" ? `From: ${log.phone}` : "InfraMate Bot / Contractor"}</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="whitespace-pre-line">{log.message}</p>
                <div className="text-right text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{log.status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Test message simulator */}
          <form onSubmit={handleSimulateInbound} className="p-3 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Simulate sending WhatsApp message from mobile..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="submit"
                disabled={!simText.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Test
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
