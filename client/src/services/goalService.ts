import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { ErrorHandler } from '@/lib/errorHandling';
import type { 
  GoalResponse, 
  CreateGoalRequest, 
  UpdateGoalRequest,
  GoalWithBreakdownResponse 
} from '@/lib/types';
import type { AIBreakdownRequest, AIBreakdownResponse } from '@/lib/schema';

export class GoalService {
  /**
   * Create a new goal
   */
  static async createGoal(data: CreateGoalRequest): Promise<GoalResponse> {
    try {
      useAppStore.getState().setLoading(true);
      const goal = await api.createGoal(data);
      useAppStore.getState().addGoal(goal);
      return goal;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'create goal',
        entityType: 'Goal'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Create a draft goal
   */
  static async createGoalDraft(data: CreateGoalRequest): Promise<GoalResponse> {
    try {
      useAppStore.getState().setLoading(true);
      const goal = await api.createGoalDraft(data);
      useAppStore.getState().addGoal(goal);
      return goal;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'create goal draft',
        entityType: 'Goal'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Update an existing goal
   */
  static async updateGoal(id: string, updates: UpdateGoalRequest): Promise<GoalResponse> {
    try {
      useAppStore.getState().setLoading(true);
      const goal = await api.updateGoal(id, updates);
      useAppStore.getState().updateGoal(id, goal);
      return goal;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'update goal',
        entityType: 'Goal',
        entityId: id
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(id: string): Promise<void> {
    try {
      useAppStore.getState().setLoading(true);
      await api.deleteGoal(id);
      useAppStore.getState().removeGoal(id);
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'delete goal',
        entityType: 'Goal',
        entityId: id
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Fetch all goals and update store
   */
  static async fetchGoals(): Promise<GoalResponse[]> {
    try {
      useAppStore.getState().setLoading(true);
      const goals = await api.getGoals();
      useAppStore.getState().setGoals(goals);
      return goals;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'fetch goals',
        entityType: 'Goal'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Fetch a single goal with breakdown
   */
  static async fetchGoal(id: string): Promise<GoalWithBreakdownResponse> {
    try {
      useAppStore.getState().setLoading(true);
      const goal = await api.getGoal(id);
      useAppStore.getState().setActiveGoalId(id);
      return goal;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'fetch goal',
        entityType: 'Goal',
        entityId: id
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Generate AI breakdown for a goal
   */
  static async generateBreakdown(request: AIBreakdownRequest): Promise<AIBreakdownResponse> {
    try {
      useAppStore.getState().setLoading(true);
      return await api.generateBreakdown(request);
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'generate AI breakdown',
        entityType: 'Goal'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Generate AI breakdown with streaming
   */
  static async generateBreakdownStream(
    request: AIBreakdownRequest,
    onProgress: (message: string, currentChunk: number, totalChunks: number) => void,
    onChunk: (weeks: any[]) => void
  ): Promise<AIBreakdownResponse> {
    try {
      useAppStore.getState().setLoading(true);
      return await api.generateBreakdownStream(request, onProgress, onChunk);
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'generate AI breakdown stream',
        entityType: 'Goal'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Save complete goal with breakdown
   */
  static async saveCompleteGoal(
    goalData: CreateGoalRequest, 
    breakdown: AIBreakdownResponse
  ): Promise<GoalWithBreakdownResponse> {
    try {
      useAppStore.getState().setLoading(true);
      const goal = await api.saveCompleteGoal(goalData, breakdown);
      useAppStore.getState().addGoal(goal);
      return goal;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'save complete goal',
        entityType: 'Goal'
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }
}
