import { BoqEstimate, BuildingConcept, Project, Material, Expense, Worker, ProgressLog, Task } from "../types";

export interface ProjectContextPayload {
  project: Project;
  materials: Material[];
  expenses: Expense[];
  labor: Worker[];
  progress: ProgressLog[];
  tasks: Task[];
}

export const aiService = {
  async askAssistant(
    query: string,
    projectContext: ProjectContextPayload,
    chatHistory: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<string> {
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, projectContext, chatHistory }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const data = await response.json();
      return data.text || "No response received from AI assistant.";
    } catch (error: any) {
      console.error("AI Assistant query failed:", error);
      return `### ⚠️ Connection Notice\n\nCould not reach remote AI server. Using local heuristics:\n- Project: **${projectContext.project?.name}**\n- Spent: **₹${projectContext.project?.spentAmount?.toLocaleString()}** of **₹${projectContext.project?.budget?.toLocaleString()}**\n- Please check network or retry your prompt.`;
    }
  },

  async estimateCost(payload: {
    plotArea: number;
    floors: number;
    bedrooms: number;
    bathrooms: number;
    finishQuality: string;
    locationTier: string;
    structureType: string;
  }): Promise<BoqEstimate> {
    const response = await fetch("/api/ai/cost-estimation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  },

  async generateBuildingConcepts(payload: {
    plotArea: number;
    floors: number;
    bedrooms: number;
    bathrooms: number;
    style: string;
    budget: string;
  }): Promise<{ concepts: BuildingConcept[] }> {
    const response = await fetch("/api/ai/visualize-building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return response.json();
  },
};
