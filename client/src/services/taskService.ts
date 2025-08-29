import { api } from '@/lib/api';
import { useAppStore } from '@/stores/appStore';
import { ErrorHandler } from '@/lib/errorHandling';
import type { DailyTaskResponse, UpdateTaskRequest } from '@/lib/types';

export class TaskService {
  /**
   * Update a task
   */
  static async updateTask(id: string, updates: UpdateTaskRequest): Promise<DailyTaskResponse> {
    try {
      useAppStore.getState().setLoading(true);
      const task = await api.updateTask(id, updates);

      // Update the task in the goal's breakdown using a more targeted approach
      // to prevent unnecessary re-renders and scrolling issues
      const store = useAppStore.getState();
      const goals = store.goals;

      const updatedGoals = goals.map(goal => {
        if ('weeklyGoals' in goal) {
          const goalWithBreakdown = goal as any;
          const hasTaskInGoal = goalWithBreakdown.weeklyGoals?.some((wg: any) =>
            wg.tasks?.some((t: any) => t.id === id)
          );

          // Only update this goal if it contains the task
          if (hasTaskInGoal) {
            return {
              ...goalWithBreakdown,
              weeklyGoals: goalWithBreakdown.weeklyGoals?.map((wg: any) => ({
                ...wg,
                tasks: wg.tasks?.map((t: any) => t.id === id ? { ...t, ...updates } : t) || []
              })) || []
            };
          }
        }
        return goal;
      });

      store.setGoals(updatedGoals);
      return task;
    } catch (error) {
      const message = ErrorHandler.handleAndLog(error, {
        operation: 'update task',
        entityType: 'Task',
        entityId: id
      });
      throw new Error(message);
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }
}
