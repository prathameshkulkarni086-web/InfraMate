import {
  Transaction,
  ReturnRequest,
  RefundRecord,
  SupportTicket,
  SupportMessage,
  WhatsAppMessage,
  ReturnStatus,
  RefundStatus,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  AIEscalationSummary,
  User,
} from "../types";
import { storageService } from "./storageService";

const STORAGE_KEYS = {
  TRANSACTIONS: "infrasync_transactions_v1",
  RETURNS: "infrasync_returns_v1",
  REFUNDS: "infrasync_refunds_v1",
  TICKETS: "infrasync_support_tickets_v1",
  WHATSAPP_LOGS: "infrasync_whatsapp_logs_v1",
};

// Realistic Seed Transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-2026-004821",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    date: "2026-03-01",
    type: "Material Purchase",
    materialName: "UltraTech 53-Grade OPC Cement (50kg bags)",
    category: "Cement & Concrete",
    vendorName: "Shree Ganesh Building Materials Pvt Ltd",
    vendorId: "supp-1",
    quantity: 400,
    unit: "bags",
    unitPrice: 385,
    tax: 27720,
    amount: 181720,
    paymentMethod: "Bank Transfer (NEFT)",
    paymentStatus: "Paid",
    invoiceNumber: "INV-SGBM-2026-8812",
    purchaseOrderNumber: "PO-2026-0089",
    deliveryStatus: "Delivered",
    returnStatus: "None",
    createdBy: "usr-pm-1",
    createdByName: "Rajesh Sharma",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    notes: "Batch #4491 checked by QC engineer. Soundness and compressive strength verified.",
    createdAt: "2026-03-01T09:30:00Z",
  },
  {
    id: "TXN-2026-004822",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    date: "2026-02-28",
    type: "Material Purchase",
    materialName: "Tata Tiscon 550D TMT Rebar (16mm, 12m lengths)",
    category: "Structural Steel",
    vendorName: "Apex Steel & Alloys Distributorship",
    vendorId: "supp-2",
    quantity: 12,
    unit: "tons",
    unitPrice: 64500,
    tax: 139320,
    amount: 913320,
    paymentMethod: "Bank Transfer (NEFT)",
    paymentStatus: "Paid",
    invoiceNumber: "INV-ASAD-9931",
    purchaseOrderNumber: "PO-2026-0088",
    deliveryStatus: "Delivered",
    returnStatus: "Return Requested",
    returnId: "RET-2026-000842",
    createdBy: "usr-pm-1",
    createdByName: "Rajesh Sharma",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    notes: "2 tons of 16mm rebar found with heavy surface oxidation and bent ribs during unloading.",
    createdAt: "2026-02-28T14:15:00Z",
  },
  {
    id: "TXN-2026-004823",
    projectId: "proj-2",
    projectName: "Skyline Business Park Phase 2",
    date: "2026-03-02",
    type: "Material Purchase",
    materialName: "M-Sand (Manufactured Zone II Sand)",
    category: "Aggregates",
    vendorName: "Deccan Quarry & Crusher Works",
    vendorId: "supp-3",
    quantity: 850,
    unit: "cu.ft",
    unitPrice: 62,
    tax: 9486,
    amount: 62186,
    paymentMethod: "UPI / Digital",
    paymentStatus: "Paid",
    invoiceNumber: "INV-DQCW-4412",
    purchaseOrderNumber: "PO-2026-0091",
    deliveryStatus: "Delivered",
    returnStatus: "None",
    createdBy: "usr-eng-1",
    createdByName: "Ananya Desai",
    notes: "Direct tipper delivery to Batching Plant Stockpile #2.",
    createdAt: "2026-03-02T11:00:00Z",
  },
  {
    id: "TXN-2026-004824",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    date: "2026-02-26",
    type: "Material Purchase",
    materialName: "Havells Heavy Duty PVC Conduits 25mm",
    category: "Electrical",
    vendorName: "Bright Sparks Electrical Supplies",
    vendorId: "supp-4",
    quantity: 250,
    unit: "units",
    unitPrice: 195,
    tax: 8775,
    amount: 57525,
    paymentMethod: "UPI / Digital",
    paymentStatus: "Paid",
    invoiceNumber: "INV-BSES-1029",
    purchaseOrderNumber: "PO-2026-0085",
    deliveryStatus: "Delivered",
    returnStatus: "Refund Completed",
    returnId: "RET-2026-000839",
    createdBy: "usr-pm-1",
    createdByName: "Rajesh Sharma",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    notes: "30 units were defective batch with cracked joints. Return inspected and full credit refunded.",
    createdAt: "2026-02-26T16:20:00Z",
  },
  {
    id: "TXN-2026-004825",
    projectId: "proj-2",
    projectName: "Skyline Business Park Phase 2",
    date: "2026-03-03",
    type: "Purchase Order",
    materialName: "RMC M35 Ready Mix Concrete with Retarder",
    category: "Cement & Concrete",
    vendorName: "ACC ReadyMix Plant Whitefield",
    vendorId: "supp-5",
    quantity: 60,
    unit: "cu.m",
    unitPrice: 4850,
    tax: 52380,
    amount: 343380,
    paymentMethod: "Bank Transfer (NEFT)",
    paymentStatus: "Pending",
    purchaseOrderNumber: "PO-2026-0094",
    deliveryStatus: "In Transit",
    returnStatus: "None",
    createdBy: "usr-pm-1",
    createdByName: "Rajesh Sharma",
    notes: "Slump requirement 140mm +/- 25mm. Pouring scheduled for Block B 4th slab.",
    createdAt: "2026-03-03T07:15:00Z",
  },
  {
    id: "TXN-2026-004826",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    date: "2026-02-24",
    type: "Payment",
    materialName: "Subcontractor Progress Milestone 3 (Shuttering & Staging)",
    category: "Labor & Subcontract",
    vendorName: "Apex Construction Contractors",
    vendorId: "usr-cont-1",
    amount: 450000,
    paymentMethod: "Bank Transfer (NEFT)",
    paymentStatus: "Paid",
    invoiceNumber: "INV-APEX-RA-03",
    deliveryStatus: "Delivered",
    returnStatus: "None",
    createdBy: "usr-admin-1",
    createdByName: "Vikram Singhania",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    notes: "Certified by Site Engineer Ananya Desai after QA check.",
    createdAt: "2026-02-24T18:00:00Z",
  },
  {
    id: "TXN-2026-004827",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    date: "2026-03-02",
    type: "Material Sale",
    materialName: "Surplus Scrap Reinforcement Steel & Cut Pieces",
    category: "Scrap & Salvage",
    vendorName: "National Scrap & Recycling Traders",
    quantity: 3.5,
    unit: "tons",
    unitPrice: 32000,
    tax: 20160,
    amount: 132160,
    paymentMethod: "Bank Transfer (NEFT)",
    paymentStatus: "Paid",
    invoiceNumber: "INV-OUT-2026-012",
    deliveryStatus: "Delivered",
    returnStatus: "None",
    createdBy: "usr-pm-1",
    createdByName: "Rajesh Sharma",
    notes: "Authorized surplus scrap sale for project account recovery.",
    createdAt: "2026-03-02T15:45:00Z",
  },
  {
    id: "TXN-2026-004828",
    projectId: "proj-2",
    projectName: "Skyline Business Park Phase 2",
    date: "2026-02-20",
    type: "Expense",
    materialName: "JCB 3DX Excavator Site Hire (5 Days)",
    category: "Equipment",
    vendorName: "Karnataka Heavy Earthmovers",
    quantity: 5,
    unit: "units",
    unitPrice: 9500,
    tax: 8550,
    amount: 56050,
    paymentMethod: "UPI / Digital",
    paymentStatus: "Paid",
    invoiceNumber: "INV-KHE-882",
    deliveryStatus: "Delivered",
    returnStatus: "None",
    createdBy: "usr-pm-1",
    createdByName: "Rajesh Sharma",
    notes: "Basement perimeter trenching and drainage line preparation.",
    createdAt: "2026-02-20T10:00:00Z",
  },
];

// Realistic Seed Return Requests
export const INITIAL_RETURNS: ReturnRequest[] = [
  {
    id: "RET-2026-000842",
    transactionId: "TXN-2026-004822",
    transactionNumber: "TXN-2026-004822",
    userId: "usr-pm-1",
    userName: "Rajesh Sharma",
    userRole: "project_manager",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    materialName: "Tata Tiscon 550D TMT Rebar (16mm, 12m lengths)",
    quantity: 2,
    unit: "tons",
    reason: "Damaged material",
    condition: "Physically Damaged",
    description:
      "Upon site delivery unloading, bundle #B-19 had severe water corrosion, flaking rust, and distorted transverse ribs failing the IS 1786 bend test. Vendor notified.",
    photos: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?w=600&auto=format&fit=crop&q=80",
    ],
    requestedRefundAmount: 152220,
    preferredResolution: "Replacement Material",
    status: "Under Review",
    timeline: [
      {
        status: "Return Requested",
        timestamp: "2026-02-28T15:30:00Z",
        actor: "Rajesh Sharma (Project Manager)",
        notes: "Return claim filed with photos of damaged rebar bundle.",
      },
      {
        status: "Under Review",
        timestamp: "2026-03-01T10:00:00Z",
        actor: "Gurpreet Singh (Contractor)",
        notes: "Contractor reviewed site QA report. Contacting supplier logistics for replacement pickup.",
      },
    ],
    createdAt: "2026-02-28T15:30:00Z",
    updatedAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "RET-2026-000839",
    transactionId: "TXN-2026-004824",
    transactionNumber: "TXN-2026-004824",
    userId: "usr-pm-1",
    userName: "Rajesh Sharma",
    userRole: "project_manager",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    materialName: "Havells Heavy Duty PVC Conduits 25mm",
    quantity: 30,
    unit: "units",
    reason: "Defective product",
    condition: "Defective Batch",
    description: "Hairline cracks in socket couplings. Returned to vendor warehouse for credit adjustment.",
    requestedRefundAmount: 6903,
    preferredResolution: "Full Refund",
    status: "Refund Completed",
    refundId: "REF-2026-000319",
    timeline: [
      {
        status: "Return Requested",
        timestamp: "2026-02-26T17:00:00Z",
        actor: "Rajesh Sharma",
        notes: "Return initiated for cracked batch.",
      },
      {
        status: "Approved",
        timestamp: "2026-02-27T09:15:00Z",
        actor: "Bright Sparks Vendor / Gurpreet Singh",
        notes: "Return approved by supplier rep.",
      },
      {
        status: "Material Pickup / Return",
        timestamp: "2026-02-27T14:30:00Z",
        actor: "Store Logistics",
        notes: "Defective units returned via vendor dispatch.",
      },
      {
        status: "Inspection",
        timestamp: "2026-02-27T16:00:00Z",
        actor: "Vendor QC Desk",
        notes: "Passed return verification.",
      },
      {
        status: "Refund Processing",
        timestamp: "2026-02-28T10:00:00Z",
        actor: "Accounts Desk",
        notes: "Refund initiated to company bank account.",
      },
      {
        status: "Refund Completed",
        timestamp: "2026-02-28T11:45:00Z",
        actor: "System / Finance",
        notes: "₹6,903 credited via IMPS #REF-992102.",
      },
    ],
    reviewerNotes: "Verified defective batch by electrical engineer. Credit refunded.",
    reviewedBy: "Gurpreet Singh (Contractor)",
    reviewedAt: "2026-02-27T09:15:00Z",
    createdAt: "2026-02-26T17:00:00Z",
    updatedAt: "2026-02-28T11:45:00Z",
  },
];

// Realistic Seed Refund Records
export const INITIAL_REFUNDS: RefundRecord[] = [
  {
    id: "REF-2026-000319",
    returnId: "RET-2026-000839",
    returnNumber: "RET-2026-000839",
    transactionId: "TXN-2026-004824",
    transactionNumber: "TXN-2026-004824",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    amount: 6903,
    method: "Original Payment Method (UPI/Bank)",
    status: "Completed",
    referenceNumber: "IMPS/6059281920/BRIGHTSPARKS",
    requestedDate: "2026-02-26",
    approvedDate: "2026-02-27",
    processedDate: "2026-02-28",
    completedDate: "2026-02-28",
    processedBy: "Accounts Admin",
    notes: "Full refund credited for 30 returned PVC conduits.",
  },
];

// Realistic Seed Support Tickets & AI Summaries
export const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "ticket-101",
    ticketNumber: "INF-SUP-2026-001245",
    userId: "usr-pm-1",
    userName: "Rajesh Sharma",
    userEmail: "rajesh.pm@infrasync.io",
    userPhone: "+91 98450 12345",
    userRole: "project_manager",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    category: "Material",
    priority: "High",
    subject: "Damaged TMT Rebar Delivery (TXN-2026-004822) & Urgent Replacement",
    description:
      "We received 12 tons of 16mm rebar but 2 tons have excessive rust and deformation. Need contractor confirmation for vendor replacement before slab casting on Friday.",
    relatedTransactionId: "TXN-2026-004822",
    relatedTransactionNumber: "TXN-2026-004822",
    relatedReturnId: "RET-2026-000842",
    relatedReturnNumber: "RET-2026-000842",
    status: "Waiting for Contractor",
    source: "web",
    aiResolved: false,
    aiConfidence: 0.65,
    aiEscalationSummary: {
      userRole: "Project Manager (Rajesh Sharma)",
      userName: "Rajesh Sharma",
      projectName: "Emerald Greens Residential Enclave",
      issue:
        "2 tons of 16mm TMT rebar damaged in TXN-2026-004822. Return request RET-2026-000842 created for ₹1,52,220.",
      transactionRef: "TXN-2026-004822",
      returnRef: "RET-2026-000842",
      requestedAction:
        "Urgent vendor replacement approval by contractor Gurpreet Singh before March 6th slab pour.",
      aiResolution:
        "AI verified purchase order PO-2026-0088 and return submission RET-2026-000842, but vendor replacement scheduling requires contractor sign-off.",
      recommendedAction:
        "Contractor Gurpreet Singh should contact Apex Steel supplier dispatch and approve replacement delivery slot.",
    },
    messages: [
      {
        id: "msg-101-1",
        ticketId: "ticket-101",
        senderId: "usr-pm-1",
        senderName: "Rajesh Sharma",
        senderRole: "Project Manager",
        senderType: "user",
        message:
          "Hi InfraMate AI, can you check transaction TXN-2026-004822? We received rusted TMT rebar and raised return RET-2026-000842. We need urgent replacement by Thursday.",
        source: "web",
        createdAt: "2026-03-01T09:45:00Z",
      },
      {
        id: "msg-101-2",
        ticketId: "ticket-101",
        senderId: "ai-assistant",
        senderName: "InfraMate AI Assistant (24/7)",
        senderRole: "AI Support",
        senderType: "ai",
        message:
          "I have retrieved transaction **TXN-2026-004822** for *Tata Tiscon 550D TMT Rebar (16mm)* from *Apex Steel & Alloys* (Total: ₹9,13,320). I confirm return request **RET-2026-000842** has been logged for 2 tons (claim value: ₹1,52,220). Because this directly impacts the upcoming slab casting schedule, I am escalating this ticket with a structured summary to your assigned contractor **Gurpreet Singh**.",
        source: "web",
        createdAt: "2026-03-01T09:45:30Z",
        isEscalationSummary: false,
      },
      {
        id: "msg-101-3",
        ticketId: "ticket-101",
        senderId: "system-escalator",
        senderName: "InfraMate Escalation Bot",
        senderRole: "System",
        senderType: "system",
        message:
          "📋 **AI Escalation Summary Generated for Contractor Gurpreet Singh**\n- **Project**: Emerald Greens Residential Enclave\n- **Transaction Ref**: TXN-2026-004822 / PO-2026-0088\n- **Return Request**: RET-2026-000842 (2 Tons Rebar)\n- **Priority**: High / Critical Schedule\n- **Contractor Action**: Dispatch truck replacement with Apex Steel.",
        source: "web",
        createdAt: "2026-03-01T09:46:00Z",
        isEscalationSummary: true,
      },
    ],
    createdAt: "2026-03-01T09:45:00Z",
    updatedAt: "2026-03-01T09:46:00Z",
  },
  {
    id: "ticket-102",
    ticketNumber: "INF-SUP-2026-001246",
    userId: "usr-client-1",
    userName: "Dr. Arvind Rao",
    userEmail: "arvind.rao@medicare.org",
    userPhone: "+91 98190 23456",
    userRole: "client",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    category: "Payment",
    priority: "Medium",
    subject: "Inquiry on Subcontractor Payment Milestone 3 & Invoice Copy",
    description: "Wanted clarification on payment TXN-2026-004826 of ₹4,50,000 for Shuttering & Staging.",
    relatedTransactionId: "TXN-2026-004826",
    relatedTransactionNumber: "TXN-2026-004826",
    status: "Resolved",
    source: "whatsapp",
    aiResolved: true,
    aiConfidence: 0.98,
    messages: [
      {
        id: "msg-102-1",
        ticketId: "ticket-102",
        senderId: "usr-client-1",
        senderName: "Dr. Arvind Rao",
        senderRole: "Client",
        senderType: "user",
        message:
          "Hello, I received a notification regarding payment TXN-2026-004826 for ₹4,50,000. Can you confirm if this was inspected before payment release?",
        source: "whatsapp",
        createdAt: "2026-02-25T11:00:00Z",
      },
      {
        id: "msg-102-2",
        ticketId: "ticket-102",
        senderId: "ai-assistant",
        senderName: "InfraMate AI Assistant (24/7)",
        senderRole: "AI Support",
        senderType: "ai",
        message:
          "Hello Dr. Arvind Rao! Yes, transaction **TXN-2026-004826** (₹4,50,000 for Subcontractor RA Bill 03 - Shuttering & Staging) was formally inspected and approved by Site Engineer **Ananya Desai** on Feb 24th, with 100% QA clearance. The digital voucher is stored under invoice `#INV-APEX-RA-03`. Would you like a copy forwarded to your registered email?",
        source: "whatsapp",
        createdAt: "2026-02-25T11:01:10Z",
      },
      {
        id: "msg-102-3",
        ticketId: "ticket-102",
        senderId: "usr-client-1",
        senderName: "Dr. Arvind Rao",
        senderRole: "Client",
        senderType: "user",
        message: "Thank you for the quick clarification! That resolves my question.",
        source: "whatsapp",
        createdAt: "2026-02-25T11:05:00Z",
      },
    ],
    createdAt: "2026-02-25T11:00:00Z",
    updatedAt: "2026-02-25T11:05:00Z",
    resolvedAt: "2026-02-25T11:05:00Z",
  },
  {
    id: "ticket-103",
    ticketNumber: "INF-SUP-2026-001247",
    userId: "usr-eng-1",
    userName: "Ananya Desai",
    userEmail: "ananya.eng@infrasync.io",
    userPhone: "+91 97110 87654",
    userRole: "site_engineer",
    projectId: "proj-2",
    projectName: "Skyline Business Park Phase 2",
    contractorId: "usr-cont-1",
    contractorName: "Gurpreet Singh (Apex Contractors)",
    category: "Delivery",
    priority: "Urgent",
    subject: "RMC Transit Status (PO-2026-0094) for Slab Pouring",
    description: "Checking live ETA for 60 cu.m ReadyMix concrete batch dispatched from ACC Whitefield.",
    relatedTransactionId: "TXN-2026-004825",
    relatedTransactionNumber: "TXN-2026-004825",
    status: "Contractor Responded",
    source: "web",
    aiResolved: false,
    aiConfidence: 0.72,
    messages: [
      {
        id: "msg-103-1",
        ticketId: "ticket-103",
        senderId: "usr-eng-1",
        senderName: "Ananya Desai",
        senderRole: "Site Engineer",
        senderType: "user",
        message:
          "What is the status of PO-2026-0094? Boom pump crew is ready at Site #2.",
        source: "web",
        createdAt: "2026-03-03T08:00:00Z",
      },
      {
        id: "msg-103-2",
        senderId: "usr-cont-1",
        senderName: "Gurpreet Singh",
        senderRole: "Trade Contractor",
        ticketId: "ticket-103",
        senderType: "contractor",
        message:
          "Transit mixers #1 and #2 (16 cu.m total) have crossed KR Puram toll. ETA at site is 8:40 AM. Slump test kit is calibrated.",
        source: "web",
        createdAt: "2026-03-03T08:15:00Z",
      },
    ],
    createdAt: "2026-03-03T08:00:00Z",
    updatedAt: "2026-03-03T08:15:00Z",
  },
];

// Realistic Seed WhatsApp Messages
export const INITIAL_WHATSAPP_LOGS: WhatsAppMessage[] = [
  {
    id: "wa-1",
    ticketId: "ticket-102",
    ticketNumber: "INF-SUP-2026-001246",
    userId: "usr-client-1",
    userName: "Dr. Arvind Rao",
    phone: "+91 98190 23456",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    direction: "incoming",
    message: "Status of TXN-2026-004826 milestone payment?",
    status: "read",
    createdAt: "2026-02-25T11:00:00Z",
  },
  {
    id: "wa-2",
    ticketId: "ticket-102",
    ticketNumber: "INF-SUP-2026-001246",
    userId: "usr-client-1",
    userName: "Dr. Arvind Rao",
    phone: "+91 98190 23456",
    projectId: "proj-1",
    projectName: "Emerald Greens Residential Enclave",
    direction: "outgoing",
    message: "Verified by Site Engineer Ananya Desai on Feb 24th (100% QA Passed). Invoice #INV-APEX-RA-03.",
    status: "delivered",
    createdAt: "2026-02-25T11:01:10Z",
  },
];

class SupportService {
  // --- Transactions ---
  getTransactions(projectId?: string, query?: string): Transaction[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      let list: Transaction[] = stored ? JSON.parse(stored) : INITIAL_TRANSACTIONS;
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      }
      if (projectId && projectId !== "all") {
        list = list.filter((t) => t.projectId === projectId);
      }
      if (query && query.trim()) {
        const q = query.toLowerCase().trim();
        list = list.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.materialName?.toLowerCase().includes(q) ||
            t.vendorName.toLowerCase().includes(q) ||
            t.invoiceNumber?.toLowerCase().includes(q) ||
            t.purchaseOrderNumber?.toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            t.notes?.toLowerCase().includes(q)
        );
      }
      return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  getTransactionById(id: string): Transaction | undefined {
    const list = this.getTransactions();
    return list.find((t) => t.id === id);
  }

  saveTransaction(txn: Partial<Transaction> & { projectId: string; amount: number; type: Transaction["type"] }): Transaction {
    const list = this.getTransactions();
    const existingIndex = list.findIndex((t) => t.id === txn.id);

    let saved: Transaction;
    if (existingIndex >= 0) {
      saved = {
        ...list[existingIndex],
        ...txn,
      };
      list[existingIndex] = saved;
    } else {
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const newId = txn.id || `TXN-2026-00${randomSeq}`;
      saved = {
        id: newId,
        projectId: txn.projectId,
        projectName: txn.projectName || "Project Site",
        date: txn.date || new Date().toISOString().split("T")[0],
        type: txn.type,
        materialName: txn.materialName,
        category: txn.category || "General",
        vendorName: txn.vendorName || "Commercial Supplier",
        vendorId: txn.vendorId,
        quantity: txn.quantity,
        unit: txn.unit,
        unitPrice: txn.unitPrice,
        tax: txn.tax || 0,
        amount: txn.amount,
        paymentMethod: txn.paymentMethod || "Bank Transfer (NEFT)",
        paymentStatus: txn.paymentStatus || "Paid",
        invoiceNumber: txn.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        purchaseOrderNumber: txn.purchaseOrderNumber,
        deliveryStatus: txn.deliveryStatus || "Delivered",
        returnStatus: txn.returnStatus || "None",
        returnId: txn.returnId,
        createdBy: txn.createdBy || "usr-current",
        createdByName: txn.createdByName || "Current User",
        contractorId: txn.contractorId,
        contractorName: txn.contractorName,
        notes: txn.notes,
        attachments: txn.attachments || [],
        createdAt: new Date().toISOString(),
      };
      list.unshift(saved);
    }

    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return saved;
  }

  deleteTransaction(id: string): boolean {
    const list = this.getTransactions();
    const filtered = list.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return true;
  }

  // --- Return Requests ---
  getReturns(projectId?: string): ReturnRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RETURNS);
      let list: ReturnRequest[] = stored ? JSON.parse(stored) : INITIAL_RETURNS;
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(INITIAL_RETURNS));
      }
      if (projectId && projectId !== "all") {
        list = list.filter((r) => r.projectId === projectId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_RETURNS;
    }
  }

  getReturnById(id: string): ReturnRequest | undefined {
    return this.getReturns().find((r) => r.id === id);
  }

  createReturnRequest(payload: {
    transactionId: string;
    userId: string;
    userName: string;
    userRole?: string;
    reason: ReturnRequest["reason"];
    condition: ReturnRequest["condition"];
    quantity: number;
    description: string;
    photos?: string[];
    preferredResolution: ReturnRequest["preferredResolution"];
    contractorId?: string;
    contractorName?: string;
  }): ReturnRequest {
    const txn = this.getTransactionById(payload.transactionId);
    if (!txn) throw new Error("Transaction not found");

    const returns = this.getReturns();
    const seq = Math.floor(100 + Math.random() * 900);
    const returnId = `RET-2026-000${seq}`;
    const unitPrice = txn.unitPrice || (txn.quantity ? txn.amount / txn.quantity : txn.amount);
    const refundEstimate = Math.round(unitPrice * payload.quantity);

    const now = new Date().toISOString();
    const newReturn: ReturnRequest = {
      id: returnId,
      transactionId: txn.id,
      transactionNumber: txn.id,
      userId: payload.userId,
      userName: payload.userName,
      userRole: payload.userRole,
      projectId: txn.projectId,
      projectName: txn.projectName,
      contractorId: payload.contractorId || txn.contractorId,
      contractorName: payload.contractorName || txn.contractorName,
      materialName: txn.materialName || "Material / Product",
      quantity: payload.quantity,
      unit: txn.unit || "units",
      reason: payload.reason,
      condition: payload.condition,
      description: payload.description,
      photos: payload.photos || [],
      requestedRefundAmount: refundEstimate,
      preferredResolution: payload.preferredResolution,
      status: "Return Requested",
      timeline: [
        {
          status: "Return Requested",
          timestamp: now,
          actor: `${payload.userName} (${payload.userRole || "Requester"})`,
          notes: `Return requested: ${payload.quantity} ${txn.unit || "units"} for ${payload.reason}`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    returns.unshift(newReturn);
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));

    // Update transaction returnStatus
    this.saveTransaction({
      ...txn,
      returnStatus: "Return Requested",
      returnId: returnId,
    });

    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return newReturn;
  }

  updateReturnStatus(
    returnId: string,
    newStatus: ReturnStatus,
    actorName: string,
    notes?: string
  ): ReturnRequest | undefined {
    const returns = this.getReturns();
    const index = returns.findIndex((r) => r.id === returnId);
    if (index === -1) return undefined;

    const current = returns[index];
    const now = new Date().toISOString();

    current.status = newStatus;
    current.updatedAt = now;
    current.timeline.push({
      status: newStatus,
      timestamp: now,
      actor: actorName,
      notes: notes || `Status updated to ${newStatus}`,
    });

    if (newStatus === "Approved") {
      current.reviewedBy = actorName;
      current.reviewedAt = now;
      current.reviewerNotes = notes;
    }

    // If moved to Refund Processing or Refund Completed, create / update refund record
    if (newStatus === "Refund Processing" && !current.refundId) {
      const refSeq = Math.floor(100 + Math.random() * 900);
      const refundId = `REF-2026-000${refSeq}`;
      current.refundId = refundId;

      this.createRefundRecord({
        id: refundId,
        returnId: current.id,
        returnNumber: current.id,
        transactionId: current.transactionId,
        transactionNumber: current.transactionNumber,
        projectId: current.projectId,
        projectName: current.projectName,
        amount: current.requestedRefundAmount,
        method: "Original Payment Method (UPI/Bank)",
        status: "Processing",
        requestedDate: current.createdAt.split("T")[0],
        processedBy: actorName,
        notes: `Refund generated from approved return ${current.id}`,
      });
    }

    if (newStatus === "Refund Completed" && current.refundId) {
      this.updateRefundStatus(current.refundId, "Completed", `IMPS/${Date.now().toString().slice(-8)}/REFUND`, actorName);
    }

    returns[index] = current;
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));

    // Update linked transaction
    const txn = this.getTransactionById(current.transactionId);
    if (txn) {
      this.saveTransaction({
        ...txn,
        returnStatus: newStatus,
        paymentStatus: newStatus === "Refund Completed" ? "Refunded" : txn.paymentStatus,
      });
    }

    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return current;
  }

  // --- Refunds ---
  getRefunds(projectId?: string): RefundRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REFUNDS);
      let list: RefundRecord[] = stored ? JSON.parse(stored) : INITIAL_REFUNDS;
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(INITIAL_REFUNDS));
      }
      if (projectId && projectId !== "all") {
        list = list.filter((r) => r.projectId === projectId);
      }
      return list.sort((a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
    } catch {
      return INITIAL_REFUNDS;
    }
  }

  createRefundRecord(refund: RefundRecord): RefundRecord {
    const list = this.getRefunds();
    list.unshift(refund);
    localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return refund;
  }

  updateRefundStatus(
    refundId: string,
    status: RefundStatus,
    referenceNumber?: string,
    actorName?: string
  ): RefundRecord | undefined {
    const list = this.getRefunds();
    const idx = list.findIndex((r) => r.id === refundId);
    if (idx === -1) return undefined;

    const now = new Date().toISOString().split("T")[0];
    const current = list[idx];
    current.status = status;
    if (referenceNumber) current.referenceNumber = referenceNumber;
    if (actorName) current.processedBy = actorName;
    if (status === "Completed") current.completedDate = now;
    if (status === "Processing") current.processedDate = now;
    if (status === "Approved") current.approvedDate = now;

    list[idx] = current;
    localStorage.setItem(STORAGE_KEYS.REFUNDS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return current;
  }

  // --- Support Tickets & Messages ---
  getTickets(projectId?: string, filterStatus?: string): SupportTicket[] {
    return this.getSupportTickets(projectId, filterStatus);
  }

  resolveTicket(ticketId: string, actorName?: string): SupportTicket {
    return this.updateTicketStatus(ticketId, "Resolved", actorName);
  }

  getSupportTickets(projectId?: string, filterStatus?: string): SupportTicket[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TICKETS);
      let list: SupportTicket[] = stored ? JSON.parse(stored) : INITIAL_TICKETS;
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(INITIAL_TICKETS));
      }
      if (projectId && projectId !== "all") {
        list = list.filter((t) => t.projectId === projectId);
      }
      if (filterStatus && filterStatus !== "all") {
        list = list.filter((t) => t.status === filterStatus);
      }
      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch {
      return INITIAL_TICKETS;
    }
  }

  getTicketById(id: string): SupportTicket | undefined {
    return this.getSupportTickets().find((t) => t.id === id || t.ticketNumber === id);
  }

  createTicket(payload: {
    userId: string;
    userName: string;
    userEmail?: string;
    userPhone?: string;
    userRole: User["role"];
    projectId: string;
    projectName: string;
    contractorId?: string;
    contractorName?: string;
    category: TicketCategory;
    priority: TicketPriority;
    subject: string;
    description: string;
    relatedTransactionId?: string;
    relatedReturnId?: string;
    source?: "web" | "whatsapp" | "email";
    initialMessage?: string;
  }): SupportTicket {
    const tickets = this.getSupportTickets();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `INF-SUP-2026-00${seq}`;
    const ticketId = `ticket-${Date.now()}`;
    const now = new Date().toISOString();

    const messages: SupportMessage[] = [];
    if (payload.initialMessage || payload.description) {
      messages.push({
        id: `msg-${Date.now()}-1`,
        ticketId: ticketId,
        senderId: payload.userId,
        senderName: payload.userName,
        senderRole: payload.userRole,
        senderType: "user",
        message: payload.initialMessage || payload.description,
        source: payload.source || "web",
        createdAt: now,
      });
    }

    const newTicket: SupportTicket = {
      id: ticketId,
      ticketNumber: ticketNumber,
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail,
      userPhone: payload.userPhone,
      userRole: payload.userRole,
      projectId: payload.projectId,
      projectName: payload.projectName,
      contractorId: payload.contractorId,
      contractorName: payload.contractorName,
      category: payload.category,
      priority: payload.priority,
      subject: payload.subject,
      description: payload.description,
      relatedTransactionId: payload.relatedTransactionId,
      relatedTransactionNumber: payload.relatedTransactionId,
      relatedReturnId: payload.relatedReturnId,
      relatedReturnNumber: payload.relatedReturnId,
      status: "Open",
      source: payload.source || "web",
      aiResolved: false,
      messages: messages,
      createdAt: now,
      updatedAt: now,
    };

    tickets.unshift(newTicket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return newTicket;
  }

  addTicketMessage(
    ticketId: string,
    message: {
      senderId: string;
      senderName: string;
      senderRole?: string;
      senderType: "user" | "ai" | "contractor" | "admin" | "system";
      message: string;
      source?: "web" | "whatsapp" | "email";
      attachments?: string[];
      isEscalationSummary?: boolean;
      metadata?: Record<string, any>;
    }
  ): SupportMessage {
    const tickets = this.getSupportTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId || t.ticketNumber === ticketId);
    if (idx === -1) throw new Error("Ticket not found");

    const currentTicket = tickets[idx];
    const now = new Date().toISOString();
    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId: currentTicket.id,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      senderType: message.senderType,
      message: message.message,
      source: message.source || "web",
      createdAt: now,
      attachments: message.attachments,
      isEscalationSummary: message.isEscalationSummary,
      metadata: message.metadata,
    };

    currentTicket.messages.push(newMsg);
    currentTicket.updatedAt = now;

    // Adjust status depending on sender
    if (message.senderType === "contractor" || message.senderType === "admin") {
      currentTicket.status = "Contractor Responded";
    } else if (message.senderType === "user" && currentTicket.status === "Contractor Responded") {
      currentTicket.status = "Waiting for Contractor";
    }

    tickets[idx] = currentTicket;
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return newMsg;
  }

  escalateTicketToContractor(
    ticketId: string,
    contractorId: string,
    contractorName: string,
    summary: AIEscalationSummary
  ): SupportTicket {
    const tickets = this.getSupportTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId || t.ticketNumber === ticketId);
    if (idx === -1) throw new Error("Ticket not found");

    const ticket = tickets[idx];
    const now = new Date().toISOString();

    ticket.contractorId = contractorId;
    ticket.contractorName = contractorName;
    ticket.status = "Waiting for Contractor";
    ticket.aiEscalationSummary = summary;
    ticket.updatedAt = now;

    // Add system message
    ticket.messages.push({
      id: `msg-esc-${Date.now()}`,
      ticketId: ticket.id,
      senderId: "system-escalator",
      senderName: "InfraMate AI Escalation Bot",
      senderRole: "System",
      senderType: "system",
      message: `🔔 **Escalated to Contractor: ${contractorName}**\n\n**Issue Summary**: ${summary.issue}\n**Action Requested**: ${summary.requestedAction}\n**Recommended Resolution**: ${summary.recommendedAction}`,
      source: "web",
      createdAt: now,
      isEscalationSummary: true,
    });

    tickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));

    // Also trigger in-app notification to contractor
    storageService.addNotification({
      title: `⚡ Urgent Support Escalation: ${ticket.ticketNumber}`,
      message: `${summary.userName} (${summary.userRole}) escalated: "${ticket.subject}". Immediate contractor response requested.`,
      type: "alert",
      linkTab: "support",
    });

    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return ticket;
  }

  updateTicketStatus(ticketId: string, status: TicketStatus, actorName?: string): SupportTicket {
    const tickets = this.getSupportTickets();
    const idx = tickets.findIndex((t) => t.id === ticketId || t.ticketNumber === ticketId);
    if (idx === -1) throw new Error("Ticket not found");

    const ticket = tickets[idx];
    const now = new Date().toISOString();
    ticket.status = status;
    ticket.updatedAt = now;

    if (status === "Resolved" || status === "Closed") {
      ticket.resolvedAt = now;
      ticket.messages.push({
        id: `msg-status-${Date.now()}`,
        ticketId: ticket.id,
        senderId: "system",
        senderName: "System",
        senderType: "system",
        message: `✅ Ticket marked as **${status}** by ${actorName || "Staff"}.`,
        source: "web",
        createdAt: now,
      });
    }

    tickets[idx] = ticket;
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return ticket;
  }

  // --- WhatsApp Logs ---
  getWhatsAppLogs(ticketId?: string): WhatsAppMessage[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WHATSAPP_LOGS);
      let list: WhatsAppMessage[] = stored ? JSON.parse(stored) : INITIAL_WHATSAPP_LOGS;
      if (!stored) {
        localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(INITIAL_WHATSAPP_LOGS));
      }
      if (ticketId) {
        list = list.filter((w) => w.ticketId === ticketId);
      }
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch {
      return INITIAL_WHATSAPP_LOGS;
    }
  }

  logWhatsAppMessage(payload: Omit<WhatsAppMessage, "id" | "createdAt">): WhatsAppMessage {
    const list = this.getWhatsAppLogs();
    const newMsg: WhatsAppMessage = {
      id: `wa-${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newMsg);
    localStorage.setItem(STORAGE_KEYS.WHATSAPP_LOGS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("infrasync_storage_update"));
    return newMsg;
  }

  // --- Omni Global Search ---
  globalSupportSearch(
    query: string,
    projectId?: string
  ): {
    transactions: Transaction[];
    returns: ReturnRequest[];
    refunds: RefundRecord[];
    tickets: SupportTicket[];
  } {
    if (!query || !query.trim()) {
      return {
        transactions: this.getTransactions(projectId).slice(0, 5),
        returns: this.getReturns(projectId).slice(0, 5),
        refunds: this.getRefunds(projectId).slice(0, 5),
        tickets: this.getSupportTickets(projectId).slice(0, 5),
      };
    }

    const q = query.toLowerCase().trim();
    const transactions = this.getTransactions(projectId).filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.materialName?.toLowerCase().includes(q) ||
        t.vendorName.toLowerCase().includes(q) ||
        t.invoiceNumber?.toLowerCase().includes(q) ||
        t.purchaseOrderNumber?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q)
    );

    const returns = this.getReturns(projectId).filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.transactionNumber.toLowerCase().includes(q) ||
        r.materialName.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.userName.toLowerCase().includes(q)
    );

    const refunds = this.getRefunds(projectId).filter(
      (rf) =>
        rf.id.toLowerCase().includes(q) ||
        rf.returnNumber.toLowerCase().includes(q) ||
        rf.transactionNumber.toLowerCase().includes(q) ||
        rf.referenceNumber?.toLowerCase().includes(q)
    );

    const tickets = this.getSupportTickets(projectId).filter(
      (tk) =>
        tk.ticketNumber.toLowerCase().includes(q) ||
        tk.subject.toLowerCase().includes(q) ||
        tk.description.toLowerCase().includes(q) ||
        tk.category.toLowerCase().includes(q) ||
        tk.userName.toLowerCase().includes(q) ||
        tk.relatedTransactionNumber?.toLowerCase().includes(q) ||
        tk.relatedReturnNumber?.toLowerCase().includes(q)
    );

    return { transactions, returns, refunds, tickets };
  }

  // Helper to generate WhatsApp direct launch link
  generateWhatsAppLink(phone: string, text: string): string {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(text);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
}

export const supportService = new SupportService();
