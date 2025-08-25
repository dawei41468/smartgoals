import { apiRequest } from "./queryClient";
import type { Goal, InsertGoal, AIBreakdownRequest, AIBreakdownResponse, GoalWithBreakdown, DailyTask } from "@shared/schema";

export const api = {
  // Goals
  createGoal: async (goalData: InsertGoal): Promise<Goal> => {
    const response = await apiRequest("POST", "/api/goals", goalData);
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
  generateBreakdown: async (goalData: AIBreakdownRequest): Promise<AIBreakdownResponse> => {
    const response = await apiRequest("POST", "/api/goals/breakdown", goalData);
    return response.json();
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
};
