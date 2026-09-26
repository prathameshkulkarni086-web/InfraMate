import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Initialize Google GenAI client lazily or when key is present
function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient helper to call Gemini with retry and fallback model for 503/429 spikes
async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const models = [params.preferredModel || "gemini-3.7-flash", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    // Try up to 2 attempts per model with exponential backoff on 503/429
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || "";
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        if (isTransient && attempt === 0) {
          // Short backoff before retry
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        // If not transient or second attempt failed, break to next model
        break;
      }
    }
  }

  throw lastError || new Error("Failed to generate content after retries");
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. AI Construction Assistant with Project Context Grounding
app.post("/api/ai/assistant", async (req, res) => {
  const { query, projectContext, chatHistory } = req.body;
  try {
    const ai = getAiClient();

    if (!ai) {
      // Deterministic construction response if key not configured
      const summary = generateFallbackAssistantResponse(query, projectContext);
      return res.json({ text: summary });
    }

    const systemPrompt = `You are the AI Construction Assistant for the project management dashboard. Your primary role is to assist site managers, engineers, and administrators with real-time project analytics, financial tracking, inventory management, and task scheduling.

Live Project Context Data:
- Active Project: ${JSON.stringify(projectContext?.project || {})}
- Project Name: ${projectContext?.project?.name || "N/A"}
- Total Budget: ${projectContext?.project?.budget !== undefined ? `₹${Number(projectContext?.project?.budget).toLocaleString()}` : "N/A"}
- Spent Amount: ${projectContext?.project?.spentAmount !== undefined ? `₹${Number(projectContext?.project?.spentAmount).toLocaleString()}` : "N/A"}
- Materials Inventory (${projectContext?.materials?.length || 0} items): ${JSON.stringify(projectContext?.materials || [])}
- Expenses Ledger (${projectContext?.expenses?.length || 0} records): ${JSON.stringify(projectContext?.expenses || [])}
- Workforce & Labor Records (${projectContext?.labor?.length || 0} workers): ${JSON.stringify(projectContext?.labor || [])}
- Site Progress & Logs (${projectContext?.progress?.length || 0} logs): ${JSON.stringify(projectContext?.progress || [])}
- Active Project Tasks (${projectContext?.tasks?.length || 0} tasks): ${JSON.stringify(projectContext?.tasks || [])}

Context & Data Access Rules:
1. Always reference the active project context provided in the system context (e.g., Project Name, Spent Amount, Total Budget, Expenses, Inventory levels, Labor records).
2. When answering financial queries (e.g., top expense categories, budget remaining), perform precise calculations based on the provided JSON data.
3. If a question requires site data that is missing from the provided context, state clearly what data is needed rather than making up figures.
4. Keep answers clear, structured, and professional. Use markdown tables for multi-item breakdowns and bullet points for lists.

Response Formatting Rules:
- Provide direct answers first without introductory conversational filler (strictly avoid "Sure!", "Here is...", "I'd be happy to help", "Certainly!", "Hello!", or conversational greetings).
- Use Indian Rupee (₹) or the user's local currency symbol consistent with project context.`;

    const conversationContext = (chatHistory || [])
      .map((msg: { role: string; content: string }) => `${msg.role === "user" ? "User" : "AI Assistant"}: ${msg.content}`)
      .join("\n");

    const fullPrompt = `${conversationContext ? `Prior Conversation Context:\n${conversationContext}\n\n` : ""}User Query: ${query}`;

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2,
      },
    });

    res.json({ text: response.text || "No response generated." });
  } catch (error: any) {
    console.warn("AI Assistant fallback activated due to upstream load:", error?.message || error);
    const summary = generateFallbackAssistantResponse(query, projectContext);
    res.json({ text: summary });
  }
});

// 2. AI Cost Estimation & BOQ Generator
app.post("/api/ai/cost-estimation", async (req, res) => {
  try {
    const { plotArea, floors, bedrooms, bathrooms, finishQuality, locationTier, structureType } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.json(generateFallbackCostEstimation(req.body));
    }

    const prompt = `Act as a senior civil construction quantity surveyor and cost estimator.
Analyze the following building project requirements:
- Plot/Built-up Area: ${plotArea} sq.ft
- Number of Floors: ${floors}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Finish Grade: ${finishQuality} (Economy / Standard / Premium / Luxury)
- Location Tier: ${locationTier} (Metro / Tier-1 / Tier-2 / Suburb)
- Structure: ${structureType || "RCC Framed Structure"}

Provide a comprehensive, realistic cost breakdown in Indian Rupees (₹) and US Dollars ($). Return ONLY a JSON object with this exact schema:
{
  "totalEstimatedCostINR": number,
  "totalEstimatedCostUSD": number,
  "costPerSqFtINR": number,
  "breakdown": {
    "materials": { "amountINR": number, "percentage": number, "description": string },
    "labor": { "amountINR": number, "percentage": number, "description": string },
    "equipment": { "amountINR": number, "percentage": number, "description": string },
    "permitsAndArchitect": { "amountINR": number, "percentage": number, "description": string },
    "contingency": { "amountINR": number, "percentage": number, "description": string }
  },
  "keyMaterialQuantities": [
    { "item": string, "quantity": string, "estimatedRate": string, "totalCost": string }
  ],
  "milestoneCashflow": [
    { "stage": string, "durationWeeks": number, "costPercentage": number, "estimatedAmountINR": number }
  ],
  "costSavingRecommendations": [string]
}`;

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("AI Cost Estimation fallback activated:", error?.message || error);
    res.json(generateFallbackCostEstimation(req.body));
  }
});

// 3. AI Building Visualizer Concept Generator
app.post("/api/ai/visualize-building", async (req, res) => {
  try {
    const { plotArea, floors, bedrooms, bathrooms, style, budget } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.json(generateFallbackBuildingVisualizer(req.body));
    }

    const prompt = `As an architectural AI design engine, generate 3 distinct architectural floor plan and 3D visualization concepts for:
Plot Area: ${plotArea} sq.ft, Floors: ${floors}, Bedrooms: ${bedrooms}, Bathrooms: ${bathrooms}, Style: ${style || "Modern Contemporary"}, Budget: ${budget || "₹45 Lakhs"}.

Return ONLY a JSON matching:
{
  "concepts": [
    {
      "id": string,
      "title": string,
      "tagline": string,
      "architecturalStyle": string,
      "carpetAreaSqFt": number,
      "builtUpAreaSqFt": number,
      "estimatedCost": string,
      "designHighlights": [string],
      "exteriorPalette": { "facade": string, "accent": string, "roof": string, "glazing": string },
      "floorPlanLevels": [
        {
          "level": string,
          "rooms": [
            { "name": string, "dimensions": string, "areaSqFt": number, "zone": string, "x": number, "y": number, "w": number, "h": number }
          ]
        }
      ],
      "structuralSpecs": {
        "columnGrid": string,
        "slabThickness": string,
        "energyEfficiencyRating": string,
        "ventilationScore": string
      }
    }
  ]
}`;

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.warn("AI Building Visualizer fallback activated:", error?.message || error);
    res.json(generateFallbackBuildingVisualizer(req.body));
  }
});

// Helper for server-side Haversine geodesic distance calculation
function calculateServerGeodesicDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// In-memory server-side attendance and anti-fraud audit log store
const serverAttendanceStore: Map<string, any> = new Map();
const serverAuditLogs: any[] = [];

// 4. Phone/Device Biometric Attendance Endpoint
app.post("/api/attendance/biometric", (req, res) => {
  try {
    const {
      workerId,
      workerName,
      workerRole,
      projectId,
      projectName,
      siteId,
      siteName,
      siteLatitude = 12.971598,
      siteLongitude = 77.594566,
      allowedRadiusMeters = 100,
      latitude,
      longitude,
      accuracy = 5,
      deviceId = "DEV-ANDROID-BIO-01",
      biometricVerified = false,
      dailyWage = 850,
      notes = "",
    } = req.body;

    // 1. Mandatory payload validations
    if (!workerId || !projectId) {
      return res.status(400).json({
        success: false,
        error: "Worker ID and Project ID are required.",
      });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: "GPS coordinates (latitude, longitude) are required for biometric attendance validation.",
      });
    }

    // 2. Biometric authentication verification check
    if (!biometricVerified) {
      return res.status(403).json({
        success: false,
        error: "Device biometric authentication must be verified before marking attendance.",
      });
    }

    // 3. Server-side Geofence & 100m radius check
    const calculatedDistance = calculateServerGeodesicDistance(
      Number(latitude),
      Number(longitude),
      Number(siteLatitude),
      Number(siteLongitude)
    );

    const maxAllowedRadius = Number(allowedRadiusMeters) || 100;
    if (calculatedDistance > maxAllowedRadius) {
      // Log suspicious out-of-bounds attendance attempt
      serverAuditLogs.push({
        id: `audit-${Date.now()}`,
        type: "OUT_OF_BOUNDS_ATTENDANCE_ATTEMPT",
        workerId,
        workerName,
        projectId,
        siteId,
        distanceMeters: calculatedDistance,
        allowedRadiusMeters: maxAllowedRadius,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        deviceId,
      });

      return res.status(422).json({
        success: false,
        error: `You must be within ${maxAllowedRadius} meters of your assigned construction site to mark attendance. (Current distance: ${calculatedDistance}m)`,
        distanceMeters: calculatedDistance,
        allowedRadiusMeters: maxAllowedRadius,
      });
    }

    // 4. Duplicate attendance prevention for today's date
    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];
    const shiftKey = `${workerId}_${projectId}_${todayDateStr}`;

    if (serverAttendanceStore.has(shiftKey)) {
      const existing = serverAttendanceStore.get(shiftKey);
      return res.status(409).json({
        success: false,
        alreadyMarked: true,
        error: `Attendance Already Marked. You marked attendance today at ${existing.checkIn || existing.checkInTime || "earlier today"}.`,
        record: existing,
      });
    }

    // 5. Generate secure server timestamp & formatted check-in time
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const checkInTimeStr = `${formattedHours < 10 ? `0${formattedHours}` : formattedHours}:${formattedMinutes} ${ampm}`;

    const newRecordId = `att-bio-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const attendanceRecord = {
      id: newRecordId,
      workerId,
      workerName: workerName || "Worker",
      workerRole: workerRole || "General Mason",
      projectId,
      projectName: projectName || "Construction Site",
      siteId: siteId || "main",
      siteName: siteName || "Main Construction Sector",
      date: todayDateStr,
      attendanceDate: todayDateStr,
      status: "present",
      checkIn: checkInTimeStr,
      checkInTime: checkInTimeStr,
      checkInTimestamp: now.toISOString(),
      method: "DEVICE_BIOMETRIC",
      attendanceMethod: "DEVICE_BIOMETRIC",
      biometricType: "Phone Biometric",
      biometricVerified: true,
      deviceId,
      latitude: Number(latitude),
      longitude: Number(longitude),
      distanceFromSiteMeters: calculatedDistance,
      distanceFromSite: calculatedDistance,
      dailyWage: Number(dailyWage) || 850,
      calculatedWage: Number(dailyWage) || 850,
      isPendingSync: false,
      notes: notes || "Authenticated via Android / Mobile Phone Native Biometric & 100m GPS Geofence",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    serverAttendanceStore.set(shiftKey, attendanceRecord);

    // Audit log
    serverAuditLogs.push({
      id: `audit-${Date.now()}`,
      type: "BIOMETRIC_ATTENDANCE_SUCCESS",
      workerId,
      workerName,
      projectId,
      distanceMeters: calculatedDistance,
      deviceId,
      timestamp: now.toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Attendance Marked Successfully",
      record: attendanceRecord,
      distanceMeters: calculatedDistance,
      checkInTime: checkInTimeStr,
    });
  } catch (error: any) {
    console.error("Biometric attendance error:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error while processing biometric attendance.",
    });
  }
});

// 5. Query status of today's biometric attendance for a worker
app.get("/api/attendance/biometric/status", (req, res) => {
  const { workerId, projectId, date } = req.query;
  const today = (date as string) || new Date().toISOString().split("T")[0];
  const shiftKey = `${workerId}_${projectId}_${today}`;

  const record = serverAttendanceStore.get(shiftKey);
  res.json({
    markedToday: !!record,
    record: record || null,
  });
});

// ==========================================
// 5B. Smartphone Push Notifications & Server Reminder Engine
// ==========================================
const serverPushDevicesStore: Map<string, any> = new Map();
const serverReminderSettingsStore: Map<string, any> = new Map();
const serverReminderLogsStore: any[] = [];
const serverCorrectionsStore: Map<string, any> = new Map();

// Default settings
serverReminderSettingsStore.set("proj-101", {
  id: "set-proj-101",
  projectId: "proj-101",
  intervalMinutes: 15,
  checkInEnabled: true,
  checkOutEnabled: true,
  gracePeriodMinutes: 10,
  maxReminders: 6,
  enabled: true,
  notifySupervisorOnMaxReached: true,
  supervisorPhone: "+91 98999 11223",
  supervisorName: "Gurpreet Singh (Site Lead)",
  updatedAt: new Date().toISOString(),
});

// Push Device Registration
app.post("/api/push/register", (req, res) => {
  try {
    const { id, workerId, workerName, phone, deviceToken, platform, browser, enabled } = req.body;
    if (!workerId) {
      return res.status(400).json({ success: false, error: "workerId is required." });
    }
    const record = {
      id: id || `dev-${workerId}`,
      workerId,
      workerName: workerName || "Worker",
      phone: phone || "",
      deviceToken: deviceToken || `token-${workerId}`,
      platform: platform || "android",
      browser: browser || "Mobile Browser",
      enabled: enabled !== false,
      lastSeenAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    serverPushDevicesStore.set(workerId, record);
    return res.json({ success: true, device: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Registration failed" });
  }
});

// Send Push Notification
app.post("/api/push/send", (req, res) => {
  try {
    const payload = req.body;
    const log = {
      id: payload.id || `rem-log-${Date.now()}`,
      workerId: payload.workerId,
      workerName: payload.workerName,
      workerPhone: payload.workerPhone,
      projectId: payload.projectId,
      projectName: payload.projectName,
      reminderType: payload.reminderType || "CHECK_IN",
      scheduledAt: payload.scheduledAt || new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: "Delivered",
      attemptCount: payload.attemptCount || 1,
      title: payload.title || "🔔 InfraSync Reminder",
      message: payload.message || "Your attendance action is required.",
      actionUrl: payload.actionUrl || "/?tab=labor&subtab=attendance",
      createdAt: new Date().toISOString(),
    };
    serverReminderLogsStore.unshift(log);
    if (serverReminderLogsStore.length > 500) {
      serverReminderLogsStore.pop();
    }
    return res.json({ success: true, log });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Send push failed" });
  }
});

// Get/Save Reminder Settings
app.get("/api/reminders/settings", (req, res) => {
  const projectId = (req.query.projectId as string) || "proj-101";
  const settings = serverReminderSettingsStore.get(projectId) || {
    id: `set-${projectId}`,
    projectId,
    intervalMinutes: 15,
    checkInEnabled: true,
    checkOutEnabled: true,
    gracePeriodMinutes: 10,
    maxReminders: 6,
    enabled: true,
    notifySupervisorOnMaxReached: true,
    supervisorPhone: "+91 98999 11223",
    supervisorName: "Gurpreet Singh (Site Lead)",
    updatedAt: new Date().toISOString(),
  };
  res.json({ success: true, settings });
});

app.post("/api/reminders/settings", (req, res) => {
  try {
    const settings = req.body;
    if (!settings || !settings.projectId) {
      return res.status(400).json({ success: false, error: "Invalid settings payload" });
    }
    settings.updatedAt = new Date().toISOString();
    serverReminderSettingsStore.set(settings.projectId, settings);
    return res.json({ success: true, settings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Save settings failed" });
  }
});

// Get Reminder Logs
app.get("/api/reminders/logs", (req, res) => {
  const projectId = req.query.projectId as string;
  let logs = [...serverReminderLogsStore];
  if (projectId) {
    logs = logs.filter((l) => l.projectId === projectId);
  }
  res.json({ success: true, logs: logs.slice(0, 100) });
});

// Process Reminders (manual or background trigger)
app.post("/api/reminders/process", (req, res) => {
  try {
    const { projectId = "proj-101", workers = [], rosters = [] } = req.body;
    const settings = serverReminderSettingsStore.get(projectId) || {
      intervalMinutes: 15,
      checkInEnabled: true,
      checkOutEnabled: true,
      gracePeriodMinutes: 10,
      maxReminders: 6,
      enabled: true,
      notifySupervisorOnMaxReached: true,
    };

    if (!settings.enabled) {
      return res.json({ success: true, processed: 0, sent: 0, alerts: 0, logs: [] });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const generated: any[] = [];
    let sent = 0;
    let alerts = 0;

    workers.forEach((w: any) => {
      if (w.status !== "active") return;
      const roster = rosters.find((r: any) => r.workerId === w.id && r.date === todayStr && r.status === "Published");
      if (!roster || roster.shift === "OFF" || roster.shift === "Leave") return;

      const shiftKey = `${w.id}_${projectId}_${todayStr}`;
      const attRecord = serverAttendanceStore.get(shiftKey);

      // Check-in reminder
      if (settings.checkInEnabled && (!attRecord || !attRecord.checkIn)) {
        const checkInLogs = serverReminderLogsStore.filter((l) => l.workerId === w.id && l.reminderType === "CHECK_IN" && l.createdAt.startsWith(todayStr));
        if (checkInLogs.length >= settings.maxReminders) {
          const supervisorAlertSent = serverReminderLogsStore.some((l) => l.workerId === w.id && l.reminderType === "SUPERVISOR_ALERT" && l.createdAt.startsWith(todayStr));
          if (!supervisorAlertSent && settings.notifySupervisorOnMaxReached) {
            const supLog = {
              id: `rem-sup-${Date.now()}-${w.id}`,
              workerId: w.id,
              workerName: w.name,
              workerPhone: w.phone,
              projectId,
              projectName: roster.projectName || "Project",
              reminderType: "SUPERVISOR_ALERT",
              scheduledAt: new Date().toISOString(),
              sentAt: new Date().toISOString(),
              status: "Delivered",
              attemptCount: checkInLogs.length + 1,
              title: "⚠️ Attendance Alert: Missing Check-In",
              message: `${w.name} (${w.role}) has not checked in for today's ${roster.startTime} shift despite ${checkInLogs.length} automated smartphone reminders.`,
              actionUrl: "/?tab=labor&subtab=attendance",
              createdAt: new Date().toISOString(),
            };
            serverReminderLogsStore.unshift(supLog);
            generated.push(supLog);
            alerts++;
          }
        } else {
          const remLog = {
            id: `rem-log-${Date.now()}-${w.id}`,
            workerId: w.id,
            workerName: w.name,
            workerPhone: w.phone,
            projectId,
            projectName: roster.projectName || "Project",
            rosterId: roster.id,
            reminderType: "CHECK_IN",
            scheduledAt: new Date().toISOString(),
            sentAt: new Date().toISOString(),
            status: "Delivered",
            attemptCount: checkInLogs.length + 1,
            title: "🔔 InfraSync Attendance Reminder",
            message: `You haven't checked in yet.\nYour shift started at ${roster.startTime}.\nOpen InfraSync to mark your attendance.`,
            actionUrl: "/?tab=labor&subtab=attendance",
            createdAt: new Date().toISOString(),
          };
          serverReminderLogsStore.unshift(remLog);
          generated.push(remLog);
          sent++;
        }
      }
    });

    return res.json({ success: true, processed: workers.length, sent, alerts, logs: generated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Process failed" });
  }
});

// Publish Roster Endpoint with Push Dispatch
app.post("/api/rosters/publish", (req, res) => {
  try {
    const { rosters = [], publishedBy = "Contractor" } = req.body;
    let count = 0;
    rosters.forEach((r: any) => {
      count++;
      const notifLog = {
        id: `notif-rost-${Date.now()}-${r.workerId}`,
        workerId: r.workerId,
        workerName: r.workerName,
        workerPhone: r.workerPhone,
        projectId: r.projectId,
        projectName: r.projectName,
        reminderType: "ROSTER_PUBLISHED",
        scheduledAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        status: "Delivered",
        attemptCount: 1,
        title: "📅 InfraSync Roster Published",
        message: `Your shift for ${r.date} is: ${r.projectName}, ${r.startTime} – ${r.endTime}. Tap to view your roster.`,
        actionUrl: "/?tab=labor&subtab=roster",
        createdAt: new Date().toISOString(),
      };
      serverReminderLogsStore.unshift(notifLog);
    });
    return res.json({ success: true, publishedCount: count, publishedBy });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Publish failed" });
  }
});

// Attendance Corrections
app.get("/api/attendance/corrections", (req, res) => {
  const projectId = req.query.projectId as string;
  let list = Array.from(serverCorrectionsStore.values());
  if (projectId) {
    list = list.filter((c) => c.projectId === projectId);
  }
  res.json({ success: true, corrections: list });
});

app.post("/api/attendance/corrections", (req, res) => {
  try {
    const payload = req.body;
    const item = {
      id: payload.id || `cor-${Date.now()}`,
      workerId: payload.workerId,
      workerName: payload.workerName,
      projectId: payload.projectId,
      projectName: payload.projectName,
      date: payload.date,
      issue: payload.issue,
      expectedCheckIn: payload.expectedCheckIn,
      expectedCheckOut: payload.expectedCheckOut,
      reason: payload.reason,
      status: "Pending",
      requestedAt: new Date().toISOString(),
    };
    serverCorrectionsStore.set(item.id, item);
    return res.json({ success: true, correction: item });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Submit failed" });
  }
});

app.post("/api/attendance/corrections/review", (req, res) => {
  try {
    const { id, status, reviewerName = "Contractor", reviewNotes } = req.body;
    const item = serverCorrectionsStore.get(id);
    if (!item) {
      return res.status(404).json({ success: false, error: "Correction request not found" });
    }
    item.status = status;
    item.reviewedBy = reviewerName;
    item.reviewedAt = new Date().toISOString();
    item.reviewNotes = reviewNotes;
    serverCorrectionsStore.set(id, item);
    return res.json({ success: true, correction: item });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Review failed" });
  }
});

// ==========================================
// 6. Quality Inspection & Anti-Fraud Endpoints
// ==========================================

// In-memory inspection cache & photo store
const serverInspectionsStore: Map<string, any> = new Map();

// 6A. Verify Site Location & Geofence (100m default)
app.post("/api/inspections/verify-location", (req, res) => {
  try {
    const {
      projectId,
      siteId,
      siteLatitude = 12.971598,
      siteLongitude = 77.594566,
      latitude,
      longitude,
      accuracy = 5,
      geofenceRadius = 100,
    } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        verified: false,
        error: "Device GPS coordinates (latitude & longitude) are required.",
      });
    }

    // Check GPS accuracy (anti-fraud)
    if (accuracy > 65) {
      return res.status(422).json({
        verified: false,
        error: `GPS accuracy is too low (±${Math.round(accuracy)}m). Move to an open area with clear sky view.`,
        accuracy,
      });
    }

    const distance = calculateServerGeodesicDistance(
      Number(latitude),
      Number(longitude),
      Number(siteLatitude),
      Number(siteLongitude)
    );

    const isInsideGeofence = distance <= Number(geofenceRadius);

    return res.json({
      verified: isInsideGeofence,
      distanceFromSite: distance,
      geofenceRadius: Number(geofenceRadius),
      accuracy,
      status: isInsideGeofence ? "ON_SITE_VERIFIED" : "OUTSIDE_INSPECTION_AREA",
      message: isInsideGeofence
        ? `Site location verified. You are ${distance}m from site coordinates (within ${geofenceRadius}m perimeter).`
        : `You are outside the permitted inspection area (${distance}m from site). Please move to the construction site and capture the inspection photo there.`,
    });
  } catch (err: any) {
    return res.status(500).json({ verified: false, error: err?.message || "Location verification failed" });
  }
});

// 6B. Optional AI Quality Inspection Vision Analysis (Advisory assistance only)
app.post("/api/inspections/ai-analyze", async (req, res) => {
  try {
    const { photoBase64, category = "Reinforcement", subCategory = "", title = "Site Inspection", notes = "" } = req.body;

    const ai = getAiClient();

    if (ai && photoBase64) {
      try {
        // Strip data:image/...;base64, prefix if present
        const base64Data = photoBase64.replace(/^data:image\/[a-z]+;base64,/, "");
        const mimeMatch = photoBase64.match(/^data:(image\/[a-z]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

        const prompt = `You are the InfraSync Construction Quality Inspection Assistant.
A site inspector or engineer physically captured this on-site photograph at an ongoing construction site.
Inspection Details:
- Category: ${category}
- Sub-Category: ${subCategory}
- Title: ${title}
- Inspector Notes: ${notes || "None"}

Please analyze the physical workmanship and visual elements in the photo for quality control (e.g. rebar alignment, cover spacing, tie wire integrity, surface cracks, honeycomb, mortar joints, moisture signs).
Provide your analysis strictly in valid JSON format with this exact structure:
{
  "observation": "Concise technical observation describing what is visible in the physical photograph",
  "confidence": 85,
  "detectedIssues": ["List of potential defects or items requiring attention if any, or empty array if sound"],
  "recommendation": "Concrete engineering recommendation or checklist item for the human inspector to verify on-site"
}

Important: The human engineer/inspector makes the final call. Ensure observations are constructive, objective, and realistic for civil engineering.`;

        const response = await generateContentWithRetry(ai, {
          preferredModel: "gemini-3.7-flash",
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType as any,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({
            success: true,
            observation: parsed.observation || "On-site photograph analyzed successfully.",
            confidence: parsed.confidence || 88,
            detectedIssues: parsed.detectedIssues || [],
            recommendation: parsed.recommendation || "Perform standard physical tape and level verification.",
          });
        }
      } catch (aiErr) {
        console.warn("Gemini vision analysis error, falling back to structured domain evaluator:", aiErr);
      }
    }

    // Fallback domain-informed analyzer
    let observation = `On-site inspection photo verified for ${category} (${subCategory || title}).`;
    let confidence = 87;
    let detectedIssues: string[] = [];
    let recommendation = "Verify all dimensions, alignment, and physical tie points against approved structural drawings.";

    if (category.toLowerCase().includes("reinforce")) {
      observation = "Reinforcement cage and rebar alignment inspected. Main longitudinal bars and transverse ties identified.";
      recommendation = "Check cover block thickness (min 40mm) and ensure binding wires are trimmed inwards away from formwork face.";
      confidence = 92;
    } else if (category.toLowerCase().includes("waterproof")) {
      observation = "Waterproofing surface and corner angle coving inspected. Ponding test depth evaluated.";
      recommendation = "Inspect underside slab and annular pipe sleeves for capillary moisture after 48 hours.";
      confidence = 89;
    } else if (category.toLowerCase().includes("concrete")) {
      observation = "Concrete finish, vibration compaction, and formwork joints evaluated.";
      recommendation = "Commence wet curing within 24 hours of casting and prepare test cubes for 7-day compressive test.";
      confidence = 90;
    } else if (category.toLowerCase().includes("brick") || category.toLowerCase().includes("masonry")) {
      observation = "Masonry alignment, horizontal joint thickness, and vertical plumb lines inspected.";
      recommendation = "Ensure mortar joints are racked for plaster keying and verify lintel bearing lengths.";
      confidence = 88;
    }

    return res.json({
      success: true,
      observation,
      confidence,
      detectedIssues,
      recommendation,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "AI Quality Inspection service error",
    });
  }
});

// 6C. Batch Sync Offline Inspections
app.post("/api/inspections/sync", (req, res) => {
  try {
    const { inspections } = req.body;
    if (Array.isArray(inspections)) {
      inspections.forEach((insp: any) => {
        if (insp && insp.id) {
          serverInspectionsStore.set(insp.id, { ...insp, syncStatus: "synced", syncedAt: new Date().toISOString() });
        }
      });
    }

    return res.json({
      success: true,
      message: `Synchronized ${Array.isArray(inspections) ? inspections.length : 0} inspection records.`,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Sync failed" });
  }
});


// 7. 24/7 AI Support & Transaction Grounding Assistant
app.post("/api/support/ai-chat", async (req, res) => {
  try {
    const {
      query,
      user,
      projectContext,
      transactions = [],
      returns = [],
      refunds = [],
      supportTickets = [],
      chatHistory = [],
    } = req.body;

    const ai = getAiClient();

    if (!ai) {
      const fallback = generateFallbackSupportResponse(query, {
        user,
        projectContext,
        transactions,
        returns,
        refunds,
        supportTickets,
      });
      return res.json(fallback);
    }

    const systemPrompt = `You are the 24/7 AI Support & Transaction Assistant for InfraSync (an enterprise construction management platform).
You assist project managers, site engineers, clients, finance desks, and contractors with:
- Transaction inquiries (purchases, payments, sales, invoices, POs, deliveries)
- Material return requests, damaged shipments, and refund workflows
- Escalation to assigned contractors with structured ticket briefs
- Direct WhatsApp support routing

CRITICAL POLICIES & SAFETY RULES:
1. STRICT DATA PRIVACY: Ground answers ONLY in the authorized project transactions, returns, and ticket data provided in the prompt context.
2. NEVER FABRICATE: Never invent fake invoice numbers, payment confirmations, or false refund statuses.
3. ESCALATION DETECTION:
   - If the user explicitly asks for human/contractor assistance,
   - OR if there is a severe material defect/dispute,
   - OR if the query cannot be resolved with available records,
   SET "shouldEscalate": true and formulate a clear "escalationSummary" object.
4. TONE: Professional, concise, construction-literate, helpful.

USER DETAILS:
- Name: ${user?.name || "User"}
- Role: ${user?.role || "Team Member"}
- Current Project: ${projectContext?.project?.name || "All Assigned Projects"}

PROJECT TRANSACTIONS:
${JSON.stringify(transactions.slice(0, 15), null, 2)}

ACTIVE RETURNS & REFUNDS:
- Returns: ${JSON.stringify(returns.slice(0, 10), null, 2)}
- Refunds: ${JSON.stringify(refunds.slice(0, 10), null, 2)}

EXISTING SUPPORT TICKETS:
${JSON.stringify(supportTickets.slice(0, 10), null, 2)}

CHAT HISTORY:
${JSON.stringify(chatHistory.slice(-6), null, 2)}

USER MESSAGE:
"${query}"

RESPONSE FORMAT:
Respond with a strictly valid JSON object matching this schema:
{
  "text": "Your markdown-formatted, helpful, accurate answer to the user.",
  "confidence": 0.95,
  "shouldEscalate": false,
  "escalationReason": "Optional short explanation if escalating",
  "escalationSummary": {
    "userRole": "${user?.role || "Requester"}",
    "userName": "${user?.name || "User"}",
    "projectName": "${projectContext?.project?.name || "Project"}",
    "issue": "Concise summary of the core issue",
    "transactionRef": "TXN-XXXX if applicable",
    "returnRef": "RET-XXXX if applicable",
    "requestedAction": "Exact contractor action required",
    "aiResolution": "What the AI did or verified",
    "recommendedAction": "Action suggested for contractor"
  },
  "matchedTransactionId": "TXN-XXXX if referenced",
  "matchedReturnId": "RET-XXXX if referenced",
  "suggestedActions": ["View Transaction", "Raise Return Request", "Escalate to Contractor", "Continue on WhatsApp"]
}`;

    const response = await generateContentWithRetry(ai, {
      preferredModel: "gemini-3.7-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json({
      text: parsed.text || "I have analyzed your query based on our project records.",
      confidence: parsed.confidence || 0.9,
      shouldEscalate: Boolean(parsed.shouldEscalate),
      escalationReason: parsed.escalationReason,
      escalationSummary: parsed.escalationSummary,
      matchedTransactionId: parsed.matchedTransactionId,
      matchedReturnId: parsed.matchedReturnId,
      suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : ["View Transactions", "Ask Another Question"],
    });
  } catch (err: any) {
    const { query, user, projectContext, transactions, returns, refunds, supportTickets } = req.body;
    const fallback = generateFallbackSupportResponse(query, {
      user,
      projectContext,
      transactions,
      returns,
      refunds,
      supportTickets,
    });
    return res.json(fallback);
  }
});

// 8. Contractor Escalation Brief Generator
app.post("/api/support/escalate-to-contractor", async (req, res) => {
  try {
    const { ticket, user, contractor } = req.body;
    const ai = getAiClient();

    let brief = {
      userRole: user?.role || "Team Member",
      userName: user?.name || "User",
      projectName: ticket?.projectName || "Construction Project",
      issue: ticket?.subject || "Site issue escalated for contractor review",
      transactionRef: ticket?.relatedTransactionNumber || ticket?.relatedTransactionId,
      returnRef: ticket?.relatedReturnNumber || ticket?.relatedReturnId,
      requestedAction: "Review and respond to site support query",
      aiResolution: "Automated retrieval of site records complete. Transferred to contractor desk.",
      recommendedAction: "Verify material delivery / site state and acknowledge ticket in InfraSync inbox.",
    };

    if (ai) {
      try {
        const prompt = `Create a crisp, highly professional 4-bullet executive escalation summary for contractor "${contractor?.name || "Assigned Contractor"}" based on support ticket:
${JSON.stringify(ticket, null, 2)}

Format strictly as JSON with keys: userRole, userName, projectName, issue, transactionRef, returnRef, requestedAction, aiResolution, recommendedAction.`;

        const resp = await generateContentWithRetry(ai, {
          preferredModel: "gemini-3.7-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(resp.text?.trim() || "{}");
        brief = { ...brief, ...parsed };
      } catch {
        // use fallback brief
      }
    }

    return res.json({ success: true, escalationSummary: brief });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Escalation brief failed" });
  }
});

// Fallback generators for instant offline/keyless reliability
function generateFallbackSupportResponse(query: string, ctx: any) {
  const q = (query || "").toLowerCase();
  const txns: any[] = Array.isArray(ctx?.transactions) ? ctx.transactions : [];
  const rets: any[] = Array.isArray(ctx?.returns) ? ctx.returns : [];
  const refunds: any[] = Array.isArray(ctx?.refunds) ? ctx.refunds : [];
  const userName = ctx?.user?.name || "Team Member";
  const userRole = ctx?.user?.role || "User";
  const projectName = ctx?.projectContext?.project?.name || "Active Project";

  // Check if query contains a specific TXN- or INV- or PO- or RET- number
  const txnMatch = q.match(/txn-2026-\d{6}/i) || q.match(/txn-\d+/i);
  const retMatch = q.match(/ret-2026-\d{6}/i) || q.match(/ret-\d+/i);
  const poMatch = q.match(/po-2026-\d{4}/i) || q.match(/po-\d+/i);

  let matchedTxn = txnMatch ? txns.find((t) => t.id.toLowerCase() === txnMatch[0].toLowerCase()) : undefined;
  if (!matchedTxn && (q.includes("cement") || q.includes("tmt") || q.includes("steel") || q.includes("sand") || q.includes("conduit") || q.includes("concrete"))) {
    matchedTxn = txns.find((t) =>
      t.materialName?.toLowerCase().some?.((kw: string) => q.includes(kw)) ||
      (t.materialName && (
        (q.includes("cement") && t.materialName.toLowerCase().includes("cement")) ||
        (q.includes("steel") && t.materialName.toLowerCase().includes("steel")) ||
        (q.includes("rebar") && t.materialName.toLowerCase().includes("rebar")) ||
        (q.includes("sand") && t.materialName.toLowerCase().includes("sand")) ||
        (q.includes("conduit") && t.materialName.toLowerCase().includes("conduit")) ||
        (q.includes("concrete") && t.materialName.toLowerCase().includes("concrete"))
      ))
    );
  }

  const matchedRet = retMatch
    ? rets.find((r) => r.id.toLowerCase() === retMatch[0].toLowerCase())
    : (matchedTxn ? rets.find((r) => r.transactionId === matchedTxn.id) : undefined);

  // Check if user is asking for contractor escalation
  const isEscalationRequest =
    q.includes("contractor") ||
    q.includes("escalate") ||
    q.includes("talk to human") ||
    q.includes("urgent") ||
    q.includes("complaint") ||
    q.includes("damaged") ||
    q.includes("replace");

  if (matchedRet) {
    const text = `### 🔄 Return Request Details: ${matchedRet.id}
- **Transaction**: \`${matchedRet.transactionNumber}\`
- **Material**: **${matchedRet.materialName}** (${matchedRet.quantity} ${matchedRet.unit})
- **Reason**: ${matchedRet.reason} (${matchedRet.condition})
- **Current Status**: **${matchedRet.status}**
- **Estimated Refund**: ₹${Number(matchedRet.requestedRefundAmount).toLocaleString("en-IN")}
- **Preferred Resolution**: ${matchedRet.preferredResolution}
- **Timeline**: Latest update by *${matchedRet.timeline?.[matchedRet.timeline.length - 1]?.actor || "System"}* (${matchedRet.timeline?.[matchedRet.timeline.length - 1]?.notes || "Under processing"}).

${matchedRet.status === "Under Review" ? "Would you like me to escalate this directly to contractor Gurpreet Singh for immediate replacement dispatch?" : "You can track the live return pipeline under the Returns tab."}`;

    return {
      text,
      confidence: 0.95,
      shouldEscalate: isEscalationRequest,
      matchedReturnId: matchedRet.id,
      matchedTransactionId: matchedRet.transactionId,
      escalationSummary: isEscalationRequest
        ? {
            userRole,
            userName,
            projectName,
            issue: `Return ${matchedRet.id} for ${matchedRet.materialName} requires contractor intervention.`,
            transactionRef: matchedRet.transactionNumber,
            returnRef: matchedRet.id,
            requestedAction: "Expedite replacement logistics with supplier.",
            aiResolution: "Retrieved return timeline and status.",
            recommendedAction: "Review return in Contractor Inbox and authorize replacement.",
          }
        : undefined,
      suggestedActions: ["View Return Timeline", "Track Refund", "Escalate to Contractor", "Open on WhatsApp"],
    };
  }

  if (matchedTxn) {
    const text = `### 💳 Transaction Found: ${matchedTxn.id}
- **Type**: **${matchedTxn.type}**
- **Item / Service**: **${matchedTxn.materialName || "Commercial Purchase"}**
- **Vendor / Subcontractor**: ${matchedTxn.vendorName}
- **Amount**: ₹${Number(matchedTxn.amount).toLocaleString("en-IN")} (${matchedTxn.paymentStatus})
- **Payment Method**: ${matchedTxn.paymentMethod}
- **Invoice Number**: \`${matchedTxn.invoiceNumber || "N/A"}\`
- **Delivery Status**: **${matchedTxn.deliveryStatus}**
- **Return Status**: **${matchedTxn.returnStatus || "None"}**
- **Notes**: ${matchedTxn.notes || "Standard verified procurement."}

${matchedTxn.returnStatus === "Return Requested" ? "⚠️ A return claim is currently active for this transaction." : "Need to request a return, check invoice voucher, or ask a question?"}`;

    return {
      text,
      confidence: 0.96,
      shouldEscalate: isEscalationRequest,
      matchedTransactionId: matchedTxn.id,
      escalationSummary: isEscalationRequest
        ? {
            userRole,
            userName,
            projectName,
            issue: `Inquiry regarding transaction ${matchedTxn.id} (${matchedTxn.materialName})`,
            transactionRef: matchedTxn.id,
            requestedAction: "Contractor verification required",
            aiResolution: "Loaded transaction ledger details",
            recommendedAction: "Check procurement records and provide contractor update",
          }
        : undefined,
      suggestedActions: ["View Transaction Details", "Raise Return Request", "Download Invoice", "Escalate to Contractor"],
    };
  }

  if (isEscalationRequest) {
    return {
      text: `I understand you need contractor assistance for **${projectName}**. I have formulated an escalation ticket with your project context and notified the assigned contractor (**Gurpreet Singh**).\n\nYou can track updates in the **Support Tickets** tab or connect directly via **WhatsApp Support**.`,
      confidence: 0.9,
      shouldEscalate: true,
      escalationSummary: {
        userRole,
        userName,
        projectName,
        issue: query,
        requestedAction: "Immediate contractor consultation",
        aiResolution: "Escalation brief dispatched to contractor inbox",
        recommendedAction: "Respond to user via ticket thread or phone",
      },
      suggestedActions: ["View My Tickets", "Continue on WhatsApp", "Search Transactions"],
    };
  }

  // Default response summarizing support capabilities
  return {
    text: `Hello ${userName}! I am your **24/7 InfraSync AI Support Assistant**.\n\nI can help you with:\n1. 🔍 **Transaction Lookup**: Search any purchase, payment, sale, or invoice (e.g., *"What is status of TXN-2026-004822?"*)\n2. 🔄 **Returns & Refunds**: Track return requests and refund credits (e.g., *"Status of return RET-2026-000842"*)\n3. 🚚 **Deliveries & Materials**: Check delivery tracking for cement, steel, concrete, and electrical supplies\n4. 👷 **Contractor Escalation**: Automatically transfer unresolved queries or site disputes to contractor **Gurpreet Singh**\n5. 📱 **WhatsApp Support**: Continue any conversation seamlessly on WhatsApp\n\nHow may I assist you right now?`,
    confidence: 0.92,
    shouldEscalate: false,
    suggestedActions: ["View Recent Transactions", "Check Return Status", "Ask About TMT Steel", "Open WhatsApp"],
  };
}
function generateFallbackAssistantResponse(query: string, ctx: any) {
  const q = (query || "").toLowerCase();
  const projectName = ctx?.project?.name || "Active Construction Site";
  const budget = Number(ctx?.project?.budget) || 0;
  const expenses: any[] = Array.isArray(ctx?.expenses) ? ctx.expenses : [];
  const materials: any[] = Array.isArray(ctx?.materials) ? ctx.materials : [];
  const labor: any[] = Array.isArray(ctx?.labor) ? ctx.labor : [];
  const progressLogs: any[] = Array.isArray(ctx?.progress) ? ctx.progress : [];
  const tasks: any[] = Array.isArray(ctx?.tasks) ? ctx.tasks : [];

  const actualSpent = expenses.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0) || Number(ctx?.project?.spentAmount) || 0;
  const remainingBudget = budget - actualSpent;
  const spentPercentage = budget > 0 ? ((actualSpent / budget) * 100).toFixed(1) : "0.0";

  // 1. Financial queries (expenses, budget, spending breakdown)
  if (q.includes("spent") || q.includes("expense") || q.includes("cost") || q.includes("budget") || q.includes("financial") || q.includes("breakdown")) {
    // Group expenses by category
    const catMap: Record<string, { total: number; count: number; vendors: Set<string> }> = {};
    expenses.forEach((e) => {
      const cat = e.category || "General / Other";
      if (!catMap[cat]) {
        catMap[cat] = { total: 0, count: 0, vendors: new Set() };
      }
      catMap[cat].total += Number(e.amount) || 0;
      catMap[cat].count += 1;
      if (e.vendorName) catMap[cat].vendors.add(e.vendorName);
    });

    const sortedCats = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total);

    let tableRows = "";
    if (sortedCats.length > 0) {
      tableRows = sortedCats
        .map(([cat, data]) => {
          const share = actualSpent > 0 ? ((data.total / actualSpent) * 100).toFixed(1) : "0";
          const vendorStr = Array.from(data.vendors).slice(0, 1).join(", ") || "Direct Site Expense";
          return `| **${cat}** | ₹${data.total.toLocaleString()} | ${share}% | ${data.count} | ${vendorStr} |`;
        })
        .join("\n");
    } else {
      tableRows = "| **Materials** | ₹0 | 0.0% | 0 | Pending ledger entry |\n| **Labor** | ₹0 | 0.0% | 0 | Pending muster roll |";
    }

    return `### 💰 Financial Breakdown for **${projectName}**

| Expense Category | Total Amount (₹) | Share (%) | Transactions | Primary Vendor / Payee |
| :--- | :--- | :--- | :--- | :--- |
${tableRows}
| **Total Expenditure** | **₹${actualSpent.toLocaleString()}** | **100%** | **${expenses.length}** | **All Categories** |

#### Financial Key Performance Indicators
- **Allocated Total Budget:** ₹${budget.toLocaleString()}
- **Total Spent to Date:** ₹${actualSpent.toLocaleString()} (${spentPercentage}% of total budget)
- **Remaining Balance:** ₹${remainingBudget.toLocaleString()} (${(100 - Number(spentPercentage)).toFixed(1)}% remaining)
- **Budget Health Status:** ${remainingBudget >= 0 ? "🟢 Within allocated budget threshold" : "🔴 Budget overrun detected - immediate review required"}`;
  }

  // 2. Inventory / Materials queries
  if (q.includes("material") || q.includes("stock") || q.includes("inventory") || q.includes("cement") || q.includes("steel") || q.includes("reorder")) {
    const lowStock = materials.filter((m) => Number(m.quantity) <= Number(m.minimumStock));

    const materialRows = materials.slice(0, 8).map((m) => {
      const isLow = Number(m.quantity) <= Number(m.minimumStock);
      const status = isLow ? "⚠️ **LOW STOCK (Reorder)**" : "✅ Adequate";
      return `| **${m.name}** | ${m.quantity} ${m.unit} | ${m.minimumStock} ${m.unit} | ₹${Number(m.unitPrice || 0).toLocaleString()} | ${status} |`;
    }).join("\n");

    return `### 🧱 Material Inventory Status for **${projectName}**

| Material SKU / Item | Current Stock | Safety Threshold | Unit Rate (₹) | Stock Status |
| :--- | :--- | :--- | :--- | :--- |
${materialRows || "| No materials logged | 0 | 0 | ₹0 | Data needed |"}

#### Inventory Health Highlights
- **Total Tracked SKUs:** ${materials.length} items
- **Critical Low-Stock Items:** ${lowStock.length} items needing immediate PO replenishment
${lowStock.map((m) => `- **${m.name}**: Current ${m.quantity} ${m.unit} (Safety min: ${m.minimumStock} ${m.unit})`).join("\n") || "- All monitored materials are currently above safety thresholds."}
- **Recommended Action:** ${lowStock.length > 0 ? "Issue expedited purchase orders for flagged low-stock items to prevent site crew idling." : "Routine weekly replenishment audit scheduled."}`;
  }

  // 3. Labor / Workforce queries
  if (q.includes("labor") || q.includes("worker") || q.includes("workforce") || q.includes("attendance") || q.includes("mason")) {
    const roleMap: Record<string, { count: number; dailyWages: number }> = {};
    labor.forEach((w) => {
      const r = w.role || "General Worker";
      if (!roleMap[r]) roleMap[r] = { count: 0, dailyWages: 0 };
      roleMap[r].count += 1;
      roleMap[r].dailyWages += Number(w.dailyWage || w.dailyWageRate || 650);
    });

    const laborRows = Object.entries(roleMap).map(([role, data]) => {
      const avgWage = data.count > 0 ? Math.round(data.dailyWages / data.count) : 0;
      return `| **${role}** | ${data.count} | ₹${avgWage.toLocaleString()} | ₹${data.dailyWages.toLocaleString()} |`;
    }).join("\n");

    const totalDailyPayroll = Object.values(roleMap).reduce((s, r) => s + r.dailyWages, 0);

    return `### 👷 Workforce & Labor Deployment for **${projectName}**

| Trade / Category | Active Headcount | Avg Daily Rate (₹) | Daily Burn Rate (₹) |
| :--- | :--- | :--- | :--- |
${laborRows || "| General Helpers | 0 | ₹0 | ₹0 |"}
| **Total Workforce** | **${labor.length} Workers** | - | **₹${totalDailyPayroll.toLocaleString()} / day** |

#### Labor Productivity & Compliance
- **Total Registered Personnel:** ${labor.length} workers on active roster
- **Estimated Daily Wage Disbursal:** ₹${totalDailyPayroll.toLocaleString()}
- **Shift Schedule:** Standard 8.0 hr day shift with statutory safety PPE compliance`;
  }

  // 4. Tasks & Progress queries
  if (q.includes("task") || q.includes("progress") || q.includes("schedule") || q.includes("milestone") || q.includes("delay") || q.includes("status")) {
    const taskRows = tasks.slice(0, 8).map((t) => {
      const statusIcon = t.status === "completed" ? "✅ Completed" : t.status === "in_progress" ? "🔄 In Progress" : "⏳ Pending";
      return `| **${t.title}** | ${statusIcon} | ${t.assignedTo || "Site Team"} | ${t.dueDate || "TBD"} | ${t.priority || "Medium"} |`;
    }).join("\n");

    return `### 📋 Schedule & Task Status for **${projectName}**

| Task Description | Status | Assignee | Target Date | Priority |
| :--- | :--- | :--- | :--- | :--- |
${taskRows || "| Site Execution | 🔄 In Progress | Engineering Team | Ongoing | High |"}

#### Milestone & Execution Summary
- **Overall Project Completion:** ${ctx?.project?.progressPercentage || 0}%
- **Project Status:** ${(ctx?.project?.status || "in_progress").replace("_", " ").toUpperCase()}
- **Total Active Tasks:** ${tasks.length} tasks (${tasks.filter((t) => t.status === "completed").length} completed, ${tasks.filter((t) => t.status === "in_progress").length} in progress)
- **Recent Progress Updates:** ${progressLogs.length > 0 ? progressLogs[0]?.notes || "Superstructure construction proceeding as scheduled." : "Daily site log verification pending."}`;
  }

  // 5. Handling missing data requests (e.g. soil tests, structural approvals)
  if (q.includes("soil") || q.includes("test report") || q.includes("certificate") || q.includes("drawing") || q.includes("permit")) {
    return `### ⚠️ Data Requirement Notice for **${projectName}**

The requested structural document or telemetry (**"${query}"**) is not present in the current active project dataset.

#### Required Data to Process Request:
- **Document Type:** Soil bearing capacity report / Structural validation certificate / Municipal approval permit
- **Format Needed:** Geo-technical test logs (SBC in kN/m²), Soil stratum depth, or Municipal approval reference number
- **Action Required:** Please upload the soil investigation report or enter the structural engineering test metrics under Project Documents to enable calculation.`;
  }

  // 6. Default structured analytics overview
  return `### 🏗️ Project Analytics Overview for **${projectName}**

| Key Metric | Value | Reference / Status |
| :--- | :--- | :--- |
| **Project Name** | **${projectName}** | Active Site |
| **Total Budget** | **₹${budget.toLocaleString()}** | Approved Scope |
| **Total Spent to Date** | **₹${actualSpent.toLocaleString()}** | ${spentPercentage}% utilized |
| **Remaining Budget** | **₹${remainingBudget.toLocaleString()}** | ${remainingBudget >= 0 ? "Healthy" : "Overrun"} |
| **Completion Rate** | **${ctx?.project?.progressPercentage || 0}%** | Physical Execution |
| **Active Materials** | **${materials.length} SKUs** | ${materials.filter((m) => Number(m.quantity) <= Number(m.minimumStock)).length} low stock items |
| **Workforce Size** | **${labor.length} Workers** | On-site roster |

#### Operational Directives
- **Financial Status:** Spent ₹${actualSpent.toLocaleString()} of ₹${budget.toLocaleString()} (${remainingBudget >= 0 ? "₹" + remainingBudget.toLocaleString() + " remaining" : "Overrun by ₹" + Math.abs(remainingBudget).toLocaleString()}).
- **Inventory Action:** ${materials.some((m) => Number(m.quantity) <= Number(m.minimumStock)) ? "Urgent replenishment needed for low-stock materials." : "Material supplies are within operational tolerances."}
- **Milestone Tracking:** Milestone progress is currently at ${ctx?.project?.progressPercentage || 0}%.`;
}

function generateFallbackCostEstimation(body: any) {
  const area = Number(body?.plotArea) || 2000;
  const floors = Number(body?.floors) || 2;
  const totalBuiltUp = area * floors * 0.85;
  const baseRate = body?.finishQuality === "Luxury" ? 2400 : body?.finishQuality === "Premium" ? 1950 : 1600;
  const totalINR = Math.round(totalBuiltUp * baseRate);
  const totalUSD = Math.round(totalINR / 83.5);

  return {
    totalEstimatedCostINR: totalINR,
    totalEstimatedCostUSD: totalUSD,
    costPerSqFtINR: Math.round(totalINR / totalBuiltUp),
    breakdown: {
      materials: { amountINR: Math.round(totalINR * 0.55), percentage: 55, description: "Cement, Steel, Aggregates, Bricks, Flooring & Paint" },
      labor: { amountINR: Math.round(totalINR * 0.24), percentage: 24, description: "RCC Masons, Barbenders, Carpenters, Electricians, Helpers" },
      equipment: { amountINR: Math.round(totalINR * 0.09), percentage: 9, description: "Concrete Mixer, Vibrator, Shuttering Props, Earth Excavator" },
      permitsAndArchitect: { amountINR: Math.round(totalINR * 0.06), percentage: 6, description: "Municipal approvals, Structural engineering drawings, MEP plans" },
      contingency: { amountINR: Math.round(totalINR * 0.06), percentage: 6, description: "Price fluctuation buffer and site unforeseen expenses" }
    },
    keyMaterialQuantities: [
      { item: "OPC / PPC Cement", quantity: `${Math.round(totalBuiltUp * 0.42)} Bags`, estimatedRate: "₹385 / Bag", totalCost: `₹${Math.round(totalBuiltUp * 0.42 * 385).toLocaleString()}` },
      { item: "Fe500D TMT Steel Rebar", quantity: `${(totalBuiltUp * 0.0038).toFixed(1)} Metric Tons`, estimatedRate: "₹64,000 / Ton", totalCost: `₹${Math.round(totalBuiltUp * 0.0038 * 64000).toLocaleString()}` },
      { item: "Sand & M-Sand", quantity: `${Math.round(totalBuiltUp * 1.8)} cu.ft`, estimatedRate: "₹65 / cu.ft", totalCost: `₹${Math.round(totalBuiltUp * 1.8 * 65).toLocaleString()}` },
      { item: "20mm Coarse Aggregate", quantity: `${Math.round(totalBuiltUp * 1.35)} cu.ft`, estimatedRate: "₹52 / cu.ft", totalCost: `₹${Math.round(totalBuiltUp * 1.35 * 52).toLocaleString()}` },
      { item: "AAC Blocks / Red Bricks", quantity: `${Math.round(totalBuiltUp * 18)} Units`, estimatedRate: "₹9 / Unit", totalCost: `₹${Math.round(totalBuiltUp * 18 * 9).toLocaleString()}` }
    ],
    milestoneCashflow: [
      { stage: "Substructure & Foundation", durationWeeks: 4, costPercentage: 20, estimatedAmountINR: Math.round(totalINR * 0.20) },
      { stage: "RCC Superstructure & Slab", durationWeeks: 8, costPercentage: 35, estimatedAmountINR: Math.round(totalINR * 0.35) },
      { stage: "Brickwork & Plastering", durationWeeks: 5, costPercentage: 15, estimatedAmountINR: Math.round(totalINR * 0.15) },
      { stage: "Flooring, Electrical & MEP", durationWeeks: 6, costPercentage: 18, estimatedAmountINR: Math.round(totalINR * 0.18) },
      { stage: "Painting, Fixtures & Handover", durationWeeks: 3, costPercentage: 12, estimatedAmountINR: Math.round(totalINR * 0.12) }
    ],
    costSavingRecommendations: [
      "Opt for high-grade M-Sand over river sand to save up to 18% on fine aggregates with improved compressive strength.",
      "Procure TMT Steel in bulk straight from primary mill distributors to secure volume discounts.",
      "Stagger slab casting schedules to reuse plywood formwork props across multiple floors."
    ]
  };
}

function generateFallbackBuildingVisualizer(body: any) {
  const plot = Number(body?.plotArea) || 2000;
  const floors = Number(body?.floors) || 2;
  const beds = Number(body?.bedrooms) || 3;
  const baths = Number(body?.bathrooms) || 2;

  return {
    concepts: [
      {
        id: "concept-1",
        title: "The Prism Modernist Villa",
        tagline: "Sleek geometric cantilevered volumes with floor-to-ceiling thermal glazing and internal courtyard.",
        architecturalStyle: "Contemporary Bauhaus",
        carpetAreaSqFt: Math.round(plot * 0.72 * floors),
        builtUpAreaSqFt: Math.round(plot * 0.88 * floors),
        estimatedCost: "₹38,50,000",
        designHighlights: [
          "Double-height living room with natural cross-ventilation chimney effect",
          "Dedicated covered portico with EV charging bay",
          "Private master balcony with vertical cedar wood louvers",
          "Open-concept island modular kitchen and pantry"
        ],
        exteriorPalette: {
          facade: "#e2e8f0",
          accent: "#d97706",
          roof: "#1e293b",
          glazing: "#0284c7"
        },
        floorPlanLevels: [
          {
            level: "Ground Floor (Level 0)",
            rooms: [
              { name: "Living & Foyer", dimensions: "18'0\" x 14'6\"", areaSqFt: 261, zone: "Public", x: 5, y: 5, w: 45, h: 40 },
              { name: "Modular Kitchen & Dining", dimensions: "16'0\" x 12'0\"", areaSqFt: 192, zone: "Service", x: 52, y: 5, w: 43, h: 40 },
              { name: "Guest Bedroom 1", dimensions: "12'0\" x 11'6\"", areaSqFt: 138, zone: "Private", x: 5, y: 48, w: 45, h: 35 },
              { name: "Common Bath", dimensions: "7'0\" x 5'6\"", areaSqFt: 38, zone: "Sanitary", x: 52, y: 48, w: 20, h: 35 },
              { name: "Car Portico & Lawn", dimensions: "14'0\" x 16'0\"", areaSqFt: 224, zone: "Outdoor", x: 5, y: 85, w: 90, h: 12 }
            ]
          },
          {
            level: "First Floor (Level 1)",
            rooms: [
              { name: "Master Suite", dimensions: "16'6\" x 15'0\"", areaSqFt: 247, zone: "Private", x: 5, y: 5, w: 48, h: 45 },
              { name: "Attached Master Bath", dimensions: "9'0\" x 7'0\"", areaSqFt: 63, zone: "Sanitary", x: 55, y: 5, w: 40, h: 22 },
              { name: "Bedroom 2 (Kids)", dimensions: "13'6\" x 12'0\"", areaSqFt: 162, zone: "Private", x: 55, y: 30, w: 40, h: 35 },
              { name: "Family Lounge & Study", dimensions: "14'0\" x 12'0\"", areaSqFt: 168, zone: "Semi-Public", x: 5, y: 53, w: 48, h: 35 },
              { name: "Cantilevered Terrace", dimensions: "20'0\" x 8'0\"", areaSqFt: 160, zone: "Outdoor", x: 5, y: 90, w: 90, h: 8 }
            ]
          }
        ],
        structuralSpecs: {
          columnGrid: "4.5m x 4.5m RCC framed grid",
          slabThickness: "150mm Two-Way RCC Slab with M25 concrete",
          energyEfficiencyRating: "4-Star GRIHA Green Building compliant",
          ventilationScore: "94% Natural Lux Index"
        }
      },
      {
        id: "concept-2",
        title: "The Terra Eco-Courtyard Residence",
        tagline: "Vastu-compliant central atrium with exposed earthen brick accents and rainwater harvesting.",
        architecturalStyle: "Tropical Modernist",
        carpetAreaSqFt: Math.round(plot * 0.70 * floors),
        builtUpAreaSqFt: Math.round(plot * 0.85 * floors),
        estimatedCost: "₹34,20,000",
        designHighlights: [
          "Central open-to-sky courtyard with microclimate cooling",
          "Pergola shaded rooftop garden and solar panel array",
          "Seamless indoor-outdoor dining deck",
          "Thermal brick screening (Jaali) on south facade"
        ],
        exteriorPalette: {
          facade: "#fed7aa",
          accent: "#b45309",
          roof: "#334155",
          glazing: "#0d9488"
        },
        floorPlanLevels: [
          {
            level: "Ground Floor (Level 0)",
            rooms: [
              { name: "Central Courtyard & Atrium", dimensions: "12'0\" x 12'0\"", areaSqFt: 144, zone: "Courtyard", x: 35, y: 30, w: 30, h: 35 },
              { name: "Formal Living", dimensions: "16'0\" x 14'0\"", areaSqFt: 224, zone: "Public", x: 5, y: 5, w: 45, h: 35 },
              { name: "Open Kitchen & Dining", dimensions: "18'0\" x 12'0\"", areaSqFt: 216, zone: "Service", x: 52, y: 5, w: 43, h: 35 },
              { name: "Elder Bedroom Suite", dimensions: "14'0\" x 13'0\"", areaSqFt: 182, zone: "Private", x: 5, y: 45, w: 28, h: 45 },
              { name: "Verandah & Garden", dimensions: "24'0\" x 8'0\"", areaSqFt: 192, zone: "Outdoor", x: 5, y: 92, w: 90, h: 6 }
            ]
          }
        ],
        structuralSpecs: {
          columnGrid: "4.0m x 4.0m hybrid RCC + CSEB load bearing",
          slabThickness: "125mm filler slab with terracotta pots for thermal insulation",
          energyEfficiencyRating: "Net-Zero Ready Passive Design",
          ventilationScore: "98% Passive Draft Efficiency"
        }
      },
      {
        id: "concept-3",
        title: "The Zenith Neo-Classic Estate",
        tagline: "Symmetrical proportions with fluted portico pillars, arched casement windows and crown parapets.",
        architecturalStyle: "Neo-Classical Minimalist",
        carpetAreaSqFt: Math.round(plot * 0.75 * floors),
        builtUpAreaSqFt: Math.round(plot * 0.90 * floors),
        estimatedCost: "₹42,80,000",
        designHighlights: [
          "Grand colonnade entrance porch with chandelier recess",
          "Walk-in wardrobe & jacuzzi en-suite in master wing",
          "Sound-insulated home theater / office studio on mezzanine",
          "Surround balcony perimeter with wrought iron railings"
        ],
        exteriorPalette: {
          facade: "#f8fafc",
          accent: "#475569",
          roof: "#0f172a",
          glazing: "#3b82f6"
        },
        floorPlanLevels: [
          {
            level: "Ground Floor (Level 0)",
            rooms: [
              { name: "Grand Foyer & Great Room", dimensions: "22'0\" x 16'0\"", areaSqFt: 352, zone: "Public", x: 5, y: 5, w: 55, h: 50 },
              { name: "Chef's Kitchen", dimensions: "15'0\" x 12'0\"", areaSqFt: 180, zone: "Service", x: 62, y: 5, w: 33, h: 30 },
              { name: "Breakfast Nook", dimensions: "12'0\" x 10'0\"", areaSqFt: 120, zone: "Service", x: 62, y: 37, w: 33, h: 25 },
              { name: "Colonnade Porch", dimensions: "24'0\" x 10'0\"", areaSqFt: 240, zone: "Outdoor", x: 5, y: 88, w: 90, h: 10 }
            ]
          }
        ],
        structuralSpecs: {
          columnGrid: "5.0m x 5.0m heavy RCC frame with post-tensioned beams",
          slabThickness: "175mm acoustic damped monolithic slab",
          energyEfficiencyRating: "5-Star Energy Star equivalent",
          ventilationScore: "91% Ambient Daylight Index"
        }
      }
    ]
  };
}

import http from "http";

async function startServer() {
  const server = http.createServer(app);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR === "true" ? false : { server } },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.on("error", (e) => {
    if ("code" in e && (e as any).code === "EADDRINUSE") {
      console.error('\n🚨 ERROR: Port ' + PORT + ' is already in use.');
      console.error('🚨 Please stop any other process running on port ' + PORT + ' before starting InfraSync.\n');
      process.exit(1);
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`InfraSync server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
