import { apiRequest } from "./queryClient";
import type { Goal, InsertGoal, AIBreakdownRequest, AIBreakdownResponse, GoalWithBreakdown, DailyTask, Activity } from "@/lib/schema";

export const api = {
  // Goals
  createGoal: async (goalData: InsertGoal): Promise<Goal> => {
    const response = await apiRequest("POST", "/api/goals", goalData);
    return response.json();
  },

  createGoalDraft: async (goalData: InsertGoal): Promise<Goal> => {
    const response = await apiRequest("POST", "/api/goals?draft=true", goalData);
    return response.json();
  },

  getGoals: async (): Promise<Goal[]> => {
    const response = await apiRequest("GET", "/api/goals");
    return response.json();
  },

  getGoal: async (id: string): Promise<GoalWithBreakdown> => {
    const response = await apiRequest("GET", `/api/goals/${id}`);
    return response.json();
  },

  updateGoal: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
    const response = await apiRequest("PATCH", `/api/goals/${id}`, updates);
    return response.json();
  },

  deleteGoal: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/goals/${id}`);
  },

  // AI Breakdown
  generateBreakdown: async (request: AIBreakdownRequest): Promise<AIBreakdownResponse> => {
    const response = await apiRequest("POST", "/api/goals/breakdown", request);
    return response.json();
  },

  generateBreakdownStream: async (
    request: AIBreakdownRequest,
    onProgress: (message: string, currentChunk: number, totalChunks: number) => void,
    onChunk: (weeks: any[]) => void
  ): Promise<AIBreakdownResponse> => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch("/api/goals/breakdown/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(request),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let finalResult: AIBreakdownResponse | null = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataContent = line.slice(6);
            
            // Skip [DONE] marker and other non-JSON lines
            if (dataContent === '[DONE]' || !dataContent.trim()) {
              continue;
            }
            
            try {
              const data = JSON.parse(dataContent);
              
              if (data.type === 'progress') {
                onProgress(data.message, data.currentChunk || 0, data.totalChunks || 0);
              } else if (data.type === 'chunk') {
                onChunk(data.weeks);
              } else if (data.type === 'complete') {
                console.log('Received complete result:', data);
                finalResult = data;
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            } catch (e) {
              // Only warn for actual parsing failures, not expected markers
              if (!dataContent.startsWith('[') && dataContent.trim()) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      }
    }

    if (!finalResult) {
      throw new Error('No final result received from stream');
    }

    return finalResult;
  },

  regenerateBreakdown: async (goalData: AIBreakdownRequest, feedback?: string): Promise<AIBreakdownResponse> => {
    const response = await apiRequest("POST", "/api/goals/breakdown/regenerate", { goalData, feedback });
    return response.json();
  },

  saveCompleteGoal: async (goalData: InsertGoal, breakdown: AIBreakdownResponse): Promise<GoalWithBreakdown> => {
    const response = await apiRequest("POST", "/api/goals/complete", { goalData, breakdown });
    return response.json();
  },

  // Tasks
  updateTask: async (id: string, updates: Partial<DailyTask>): Promise<DailyTask> => {
    const response = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
    return response.json();
  },

  // Analytics
  getStats: async (): Promise<{ activeGoalsCount: number; completedTasksCount: number; successRate: number }> => {
    const response = await apiRequest("GET", "/api/analytics/stats");
    return response.json();
  },

  // Activities
  getActivities: async (limit?: number): Promise<Activity[]> => {
    const params = limit ? `?limit=${limit}` : "";
    const response = await apiRequest("GET", `/api/activities${params}`);
    return response.json();
  },
};
