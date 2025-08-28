import { apiRequest } from "./queryClient";
import { streamingApiRequest, validatedApiRequest, validatedArrayApiRequest } from "./apiHelpers";
import type {
  GoalResponse,
  DailyTaskResponse,
  UserResponse,
  ActivityResponse,
  GoalWithBreakdownResponse,
  CreateGoalRequest,
  UpdateGoalRequest,
  UpdateTaskRequest,
} from "./types";
import type { AIBreakdownRequest, AIBreakdownResponse } from "@/lib/schema";

import {
  validateGoalResponse,
  validateDailyTaskResponse,
  validateActivityResponse,
  validateGoalWithBreakdownResponse,
} from "./types";

export const api = {
  // Goals
  createGoal: async (goalData: CreateGoalRequest): Promise<GoalResponse> => {
    return validatedApiRequest("POST", "/api/goals", goalData, validateGoalResponse);
  },

  createGoalDraft: async (goalData: CreateGoalRequest): Promise<GoalResponse> => {
    return validatedApiRequest("POST", "/api/goals?draft=true", goalData, validateGoalResponse);
  },

  getGoals: async (): Promise<GoalResponse[]> => {
    return validatedArrayApiRequest("GET", "/api/goals", undefined, validateGoalResponse);
  },

  getDetailedGoals: async (): Promise<GoalWithBreakdownResponse[]> => {
    return validatedArrayApiRequest("GET", "/api/goals/detailed", undefined, validateGoalWithBreakdownResponse);
  },

  getGoal: async (id: string): Promise<GoalWithBreakdownResponse> => {
    return validatedApiRequest("GET", `/api/goals/${id}`, undefined, validateGoalWithBreakdownResponse);
  },

  updateGoal: async (id: string, updates: UpdateGoalRequest): Promise<GoalResponse> => {
    return validatedApiRequest("PATCH", `/api/goals/${id}`, updates, validateGoalResponse);
  },

  deleteGoal: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/goals/${id}`);
  },

  // AI Breakdown
  generateBreakdown: async (request: AIBreakdownRequest): Promise<AIBreakdownResponse> => {
    return validatedApiRequest("POST", "/api/goals/breakdown", request);
  },

  generateBreakdownStream: async (
    request: AIBreakdownRequest,
    onProgress: (message: string, currentChunk: number, totalChunks: number) => void,
    onChunk: (weeks: any[]) => void
  ): Promise<AIBreakdownResponse> => {
    return streamingApiRequest<AIBreakdownResponse>(
      "/api/goals/breakdown/stream",
      request,
      {
        onProgress,
        onChunk,
      }
    );
  },

  regenerateBreakdown: async (goalData: AIBreakdownRequest, feedback?: string): Promise<AIBreakdownResponse> => {
    return validatedApiRequest("POST", "/api/goals/breakdown/regenerate", { goalData, feedback });
  },

  saveCompleteGoal: async (goalData: CreateGoalRequest, breakdown: AIBreakdownResponse): Promise<GoalWithBreakdownResponse> => {
    return validatedApiRequest("POST", "/api/goals/complete", { goalData, breakdown }, validateGoalWithBreakdownResponse);
  },

  // Tasks
  updateTask: async (id: string, updates: UpdateTaskRequest): Promise<DailyTaskResponse> => {
    return validatedApiRequest("PATCH", `/api/tasks/${id}`, updates, validateDailyTaskResponse);
  },

  // Analytics
  getStats: async (): Promise<{ activeGoalsCount: number; completedTasksCount: number; successRate: number }> => {
    return validatedApiRequest("GET", "/api/analytics/stats");
  },

  // Activities
  getActivities: async (limit?: number): Promise<ActivityResponse[]> => {
    const params = limit ? `?limit=${limit}` : "";
    return validatedArrayApiRequest("GET", `/api/activities${params}`, undefined, validateActivityResponse);
  },
};
