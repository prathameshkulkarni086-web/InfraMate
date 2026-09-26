import { UserRole, PaymentMethod } from "./index";

export type TransactionType =
  | "Material Purchase"
  | "Material Sale"
  | "Payment"
  | "Refund"
  | "Expense"
  | "Invoice"
  | "Purchase Order"
  | "Return"
  | "Adjustment";

export type PaymentStatus =
  | "Paid"
  | "Pending"
  | "Partially Paid"
  | "Failed"
  | "Refunded";

export type DeliveryStatus =
  | "Delivered"
  | "In Transit"
  | "Dispatched"
  | "Pending"
  | "Delayed"
  | "Returned";

export type ReturnStatus =
  | "Return Requested"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Material Pickup / Return"
  | "Inspection"
  | "Refund Processing"
  | "Refund Completed";

export type ReturnReason =
  | "Damaged material"
  | "Wrong material"
  | "Wrong quantity"
  | "Defective product"
  | "Delivery issue"
  | "Duplicate order"
  | "Other";

export type ReturnCondition =
  | "Unopened / In Original Packaging"
  | "Opened / Intact"
  | "Physically Damaged"
  | "Defective Batch";

export type ReturnResolution =
  | "Full Refund"
  | "Replacement Material"
  | "Store Credit / Adjustment";

export interface Transaction {
  id: string; // e.g., "TXN-2026-004821"
  workspaceId?: string;
  projectId: string;
  projectName: string;
  date: string; // YYYY-MM-DD or ISO
  type: TransactionType;
  materialName?: string;
  materialId?: string;
  category?: string;
  vendorName: string;
  vendorId?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  tax?: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  invoiceNumber?: string;
  purchaseOrderNumber?: string;
  deliveryStatus: DeliveryStatus;
  returnStatus?: ReturnStatus | "None";
  returnId?: string;
  createdBy: string;
  createdByName?: string;
  contractorId?: string;
  contractorName?: string;
  notes?: string;
  attachments?: string[];
  createdAt: string;
}

export interface ReturnTimelineEvent {
  status: ReturnStatus;
  timestamp: string;
  actor: string;
  notes?: string;
}

export interface ReturnRequest {
  id: string; // e.g. "RET-2026-000842"
  workspaceId?: string;
  transactionId: string;
  transactionNumber: string;
  userId: string;
  userName: string;
  userRole?: string;
  projectId: string;
  projectName: string;
  contractorId?: string;
  contractorName?: string;
  materialName: string;
  quantity: number;
  unit: string;
  reason: ReturnReason;
  condition: ReturnCondition;
  description: string;
  photos?: string[];
  requestedRefundAmount: number;
  preferredResolution: ReturnResolution;
  status: ReturnStatus;
  timeline: ReturnTimelineEvent[];
  refundId?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RefundStatus =
  | "Pending"
  | "Approved"
  | "Processing"
  | "Completed"
  | "Failed"
  | "Rejected";

export interface RefundRecord {
  id: string; // e.g. "REF-2026-000319"
  returnId: string;
  returnNumber: string;
  transactionId: string;
  transactionNumber: string;
  projectId: string;
  projectName: string;
  amount: number;
  method:
    | "Original Payment Method (UPI/Bank)"
    | "Bank Transfer (NEFT/RTGS)"
    | "Account Adjustment / Credit Note";
  status: RefundStatus;
  referenceNumber?: string;
  requestedDate: string;
  approvedDate?: string;
  processedDate?: string;
  completedDate?: string;
  processedBy?: string;
  notes?: string;
}

export type TicketCategory =
  | "Transaction"
  | "Payment"
  | "Material"
  | "Purchase Order"
  | "Delivery"
  | "Return"
  | "Refund"
  | "Invoice"
  | "Contractor"
  | "Technical Issue"
  | "Other";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketStatus =
  | "Open"
  | "AI Handling"
  | "Waiting for Contractor"
  | "Contractor Responded"
  | "Waiting for User"
  | "Resolved"
  | "Closed";

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  senderType: "user" | "ai" | "contractor" | "admin" | "system";
  message: string;
  source: "web" | "whatsapp" | "email";
  createdAt: string;
  attachments?: string[];
  isEscalationSummary?: boolean;
  metadata?: Record<string, any>;
}

export interface AIEscalationSummary {
  userRole: string;
  userName: string;
  projectName: string;
  issue: string;
  transactionRef?: string;
  returnRef?: string;
  requestedAction: string;
  aiResolution: string;
  recommendedAction: string;
}

export interface SupportTicket {
  id: string; // e.g. "ticket-101"
  ticketNumber: string; // e.g. "INF-SUP-2026-001245"
  workspaceId?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  userRole: UserRole;
  projectId: string;
  projectName: string;
  contractorId?: string;
  contractorName?: string;
  category: TicketCategory;
  priority: TicketPriority;
  subject: string;
  description: string;
  relatedTransactionId?: string;
  relatedTransactionNumber?: string;
  relatedReturnId?: string;
  relatedReturnNumber?: string;
  status: TicketStatus;
  source: "web" | "whatsapp" | "email";
  aiResolved: boolean;
  aiConfidence?: number;
  aiEscalationSummary?: AIEscalationSummary;
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  reopenedCount?: number;
}

export interface WhatsAppMessage {
  id: string;
  ticketId?: string;
  ticketNumber?: string;
  userId: string;
  userName: string;
  phone: string;
  projectId: string;
  projectName: string;
  direction: "incoming" | "outgoing";
  message: string;
  externalMessageId?: string;
  status: "sent" | "delivered" | "read" | "failed";
  createdAt: string;
}
