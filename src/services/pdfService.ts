import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Project, Expense, Material, Worker, AttendanceRecord, ProgressLog, Task } from "../types";

export const pdfService = {
  // 1. Daily Site Report
  generateDailySiteReport(project: Project, log: ProgressLog, attendance: AttendanceRecord[], tasks: Task[]) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
    const accentColor: [number, number, number] = [217, 119, 6]; // Amber 600

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INFRASYNC", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(217, 119, 6);
    doc.text("DAILY SITE PROGRESS & DIARY REPORT", 14, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Date: ${log.date}`, 160, 18);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 26);

    // Project Info Box
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Project Overview", 14, 46);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Project Name: ${project.name}`, 14, 53);
    doc.text(`Location: ${project.location}`, 14, 59);
    doc.text(`Site Engineer / Added By: ${log.addedBy}`, 14, 65);
    doc.text(`Weather Conditions: ${log.weather || "Clear, 29°C"}`, 120, 53);
    doc.text(`Overall Project Progress: ${log.percentage}%`, 120, 59);
    doc.text(`Project Status: ${project.status.toUpperCase()}`, 120, 65);

    // Section 1: Executive Site Summary & Work Executed
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("1. Work Executed & Site Notes", 14, 76);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const splitDesc = doc.splitTextToSize(log.description, 180);
    doc.text(splitDesc, 14, 83);

    let currentY = 85 + splitDesc.length * 5;

    // Completed Tasks
    if (log.completedTasks && log.completedTasks.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Completed Milestone Tasks:", 14, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");
      log.completedTasks.forEach((t) => {
        doc.text(`• ${t}`, 18, currentY);
        currentY += 5;
      });
      currentY += 2;
    }

    // Issues & Blockers
    if (log.issues && log.issues.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(185, 28, 28);
      doc.text("Site Issues & Safety Observations:", 14, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");
      log.issues.forEach((issue) => {
        doc.text(`! ${issue}`, 18, currentY);
        currentY += 5;
      });
      doc.setTextColor(15, 23, 42);
      currentY += 4;
    }

    // Section 2: Workforce Deployment Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. Workforce Deployment & Muster", 14, currentY);
    currentY += 4;

    const attendanceData = attendance.map((a, idx) => [
      idx + 1,
      a.workerName,
      a.workerRole,
      a.status.toUpperCase(),
      a.checkIn || "-",
      a.checkOut || "-",
      `₹${a.calculatedWage.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Worker Name", "Trade / Role", "Status", "In", "Out", "Wage"]],
      body: attendanceData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Section 3: Verified Onsite Photo Records
    if (log.photos && log.photos.length > 0) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("3. Verified Onsite Visual Evidence & Photo Logs", 14, currentY);
      currentY += 6;

      log.photos.forEach((p, idx) => {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(5, 150, 105); // Emerald 600
        doc.text(`[Photo #${idx + 1}] 📷 Onsite Photo — Manually Captured`, 14, currentY);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "normal");
        doc.text(`Timestamp: ${p.timestamp || log.date} | Area: ${p.areaLocation || log.areaLocation || "General Site"}`, 100, currentY);
        currentY += 5;
        doc.text(`Description / Caption: ${p.caption}`, 18, currentY);
        currentY += 6;
      });
      currentY += 4;
    }

    // Signature Block
    if (currentY > 245) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Site Engineer Signature: __________________", 14, currentY + 15);
    doc.text("Project Manager Approval: __________________", 120, currentY + 15);

    doc.save(`Daily_Site_Report_${project.name.substring(0, 15)}_${log.date}.pdf`);
  },

  // 2. Expense & Financial Audit Report
  generateExpenseReport(project: Project, expenses: Expense[]) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INFRASYNC", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(217, 119, 6);
    doc.text("FINANCIAL & EXPENSE AUDIT REPORT", 14, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 22);

    // Summary KPIs
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetPct = Math.round((totalSpent / (project.budget || 1)) * 100);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, 46);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${project.name}`, 14, 53);
    doc.text(`Sanctioned Budget: ₹${project.budget.toLocaleString()}`, 14, 59);
    doc.text(`Total Expenditures: ₹${totalSpent.toLocaleString()}`, 14, 65);
    doc.text(`Budget Utilization: ${budgetPct}%`, 120, 53);
    doc.text(`Remaining Balance: ₹${(project.budget - totalSpent).toLocaleString()}`, 120, 59);
    doc.text(`Total Invoices Logged: ${expenses.length}`, 120, 65);

    // Table
    const tableData = expenses.map((e, idx) => [
      idx + 1,
      e.date,
      e.category,
      e.description.length > 40 ? `${e.description.substring(0, 40)}...` : e.description,
      e.vendorName || "-",
      e.paymentMethod,
      `₹${e.amount.toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: 74,
      head: [["#", "Date", "Category", "Description", "Vendor / Payee", "Payment Method", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Audited Expenses: ₹${totalSpent.toLocaleString()}`, 130, finalY);

    doc.save(`Expense_Audit_${project.name.substring(0, 15)}.pdf`);
  },

  // 3. Material Inventory Report
  generateMaterialReport(project: Project, materials: Material[]) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INFRASYNC", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(217, 119, 6);
    doc.text("MATERIAL INVENTORY & STOCK VALUATION REPORT", 14, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 22);

    const totalValuation = materials.reduce((sum, m) => sum + m.quantity * m.purchasePrice, 0);
    const lowStockCount = materials.filter((m) => m.quantity <= m.minimumStock).length;

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Project: ${project.name}`, 14, 46);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Inventory Value: ₹${Math.round(totalValuation).toLocaleString()}`, 14, 53);
    doc.text(`Cataloged SKUs: ${materials.length}`, 14, 59);
    doc.text(`Critical Low-Stock Items: ${lowStockCount}`, 120, 53);

    const tableData = materials.map((m, idx) => {
      const isLow = m.quantity <= m.minimumStock;
      return [
        idx + 1,
        m.name,
        m.category,
        `${m.quantity} ${m.unit}`,
        `${m.minimumStock} ${m.unit}`,
        `₹${m.purchasePrice.toLocaleString()}`,
        `₹${Math.round(m.quantity * m.purchasePrice).toLocaleString()}`,
        isLow ? "RE-ORDER REQ" : "HEALTHY",
      ];
    });

    autoTable(doc, {
      startY: 66,
      head: [["#", "Material Name", "Category", "Current Stock", "Min Threshold", "Unit Price", "Stock Value", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Material_Inventory_${project.name.substring(0, 15)}.pdf`);
  },

  // 4. Labor Wage Muster Roll & Attendance PDF
  generateLaborReport(project: Project, workers: Worker[], attendance: AttendanceRecord[], selectedDate?: string) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INFRASYNC", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(217, 119, 6);
    doc.text("DAILY LABOR MUSTER & ATTENDANCE AUDIT ROLL", 14, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Date: ${selectedDate || new Date().toISOString().split("T")[0]}`, 150, 18);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 26);

    // Summary block
    const safeWorkers = Array.isArray(workers) ? workers : [];
    const safeAttendance = Array.isArray(attendance) ? attendance : [];

    const presentCount = safeAttendance.filter((a) => a && (a.status === "present" || a.status === "overtime")).length;
    const totalWageToday = safeAttendance.reduce((sum, a) => sum + (a?.calculatedWage || 0), 0);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${project.name}`, 14, 44);
    doc.text(`Site Geofence Radius: ${project.attendanceRadiusMeters || 100}m`, 14, 50);
    doc.text(`Total Assigned Workers: ${safeWorkers.length}`, 120, 44);
    doc.text(`Workers Present: ${presentCount} | Today's Wage Outlay: ₹${totalWageToday.toLocaleString("en-IN")}`, 120, 50);

    const tableData = safeWorkers.map((w, idx) => {
      const att = safeAttendance.find((a) => a && a.workerId === w.id && (!selectedDate || a.date === selectedDate));
      const methodStr = att?.method ? `${att.method}${att.biometricType ? ` (${att.biometricType})` : ""}` : "Manual";
      const distanceStr = att?.distanceFromSiteMeters !== undefined ? `${att.distanceFromSiteMeters}m` : "--";
      return [
        idx + 1,
        w.employeeId || `LAB-${w.id}`,
        w.name,
        w.role,
        att?.status ? att.status.toUpperCase() : "ABSENT",
        att?.checkIn || "--",
        att?.checkOut || "--",
        methodStr,
        distanceStr,
        `₹${att?.calculatedWage || 0}`,
      ];
    });

    autoTable(doc, {
      startY: 56,
      head: [["#", "Emp ID", "Worker Name", "Trade", "Status", "In", "Out", "Method", "GPS Dist", "Wage"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 14;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("Site Supervisor Verification: _______________________", 14, finalY);
    doc.text("Project Manager Approval: _______________________", 120, finalY);

    doc.save(`Daily_Labor_Muster_${project.name.substring(0, 15)}_${selectedDate || "Today"}.pdf`);
  },

  // 4b. Monthly Workforce Payroll & Compensation Report
  generatePayrollReport(
    project: Project,
    summaries: {
      worker: Worker;
      totalDays: number;
      presentDays: number;
      halfDays: number;
      absentDays: number;
      leaveDays: number;
      overtimeHours: number;
      payableDays: number;
      basePay: number;
      overtimePay: number;
      deductions: number;
      netPay: number;
    }[],
    periodLabel: string
  ) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("INFRASYNC", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(217, 119, 6);
    doc.text("MONTHLY WORKFORCE PAYROLL & COMPENSATION REPORT", 14, 26);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Period: ${periodLabel}`, 145, 18);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 145, 26);

    const totalGross = summaries.reduce((sum, s) => sum + s.basePay + s.overtimePay, 0);
    const totalNet = summaries.reduce((sum, s) => sum + s.netPay, 0);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Project: ${project.name}`, 14, 44);
    doc.text(`Sanctioned Budget: ₹${project.budget.toLocaleString("en-IN")}`, 14, 50);
    doc.text(`Total Workforce Count: ${summaries.length}`, 120, 44);
    doc.text(`Total Net Payroll Payout: ₹${totalNet.toLocaleString("en-IN")}`, 120, 50);

    const tableData = summaries.map((s, idx) => [
      idx + 1,
      s.worker.employeeId || s.worker.id,
      s.worker.name,
      s.worker.role,
      `₹${s.worker.dailyWage}`,
      s.presentDays,
      s.halfDays,
      `${s.overtimeHours}h`,
      s.payableDays,
      `₹${s.basePay.toLocaleString("en-IN")}`,
      `₹${s.overtimePay.toLocaleString("en-IN")}`,
      `₹${s.netPay.toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
      startY: 56,
      head: [["#", "ID", "Labour Name", "Trade", "Rate/Day", "Pres", "Half", "OT", "Payable", "Base Pay", "OT Pay", "Net Pay"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: primaryColor, textColor: 255 },
      styles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 16;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Net Disbursal: ₹${totalNet.toLocaleString("en-IN")}`, 130, finalY);
    doc.setFont("helvetica", "normal");
    doc.text("HR / Accounts Authorized Signatory: ________________________", 14, finalY + 12);

    doc.save(`Monthly_Workforce_Payroll_${project.name.substring(0, 15)}_${periodLabel.replace(/\s+/g, "_")}.pdf`);
  },

  // 5. Complete Project Dossier
  generateCompleteProjectReport(
    project: Project,
    expenses: Expense[],
    materials: Material[],
    workers: Worker[],
    tasks: Task[]
  ) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 23, 42];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 42, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("INFRASYNC", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(217, 119, 6);
    doc.text("EXECUTIVE PROJECT MANAGEMENT DOSSIER", 14, 30);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Document ID: INF-${project.id.toUpperCase()}`, 145, 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 145, 28);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(project.name, 14, 54);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Location: ${project.location}`, 14, 62);
    doc.text(`Client: ${project.clientName || "N/A"} | Project Manager: ${project.managerName || "N/A"}`, 14, 68);
    doc.text(`Start Date: ${project.startDate} | Target Handover: ${project.endDate}`, 14, 74);
    doc.text(`Budget: ₹${project.budget.toLocaleString()} | Spent: ₹${project.spentAmount.toLocaleString()} (${Math.round((project.spentAmount / project.budget) * 100)}%)`, 14, 80);
    doc.text(`Overall Progress: ${project.progressPercentage}%`, 14, 86);

    // Milestones
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Project Milestones & Deliverables", 14, 96);

    const milestoneRows = (project.milestones || []).map((m, i) => [
      i + 1,
      m.title,
      m.targetDate,
      m.completedDate || "Pending",
      `${m.budgetSharePercentage}%`,
      m.status.toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 102,
      head: [["#", "Milestone", "Target Date", "Completed Date", "Budget %", "Status"]],
      body: milestoneRows,
      theme: "striped",
      headStyles: { fillColor: primaryColor },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    doc.save(`InfraSync_Project_Dossier_${project.name.substring(0, 15)}.pdf`);
  },
};
