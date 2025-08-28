import { apiRequest } from '@/lib/queryClient';
import { useAppStore } from '@/stores/appStore';

export interface StatsResponse {
  activeGoalsCount: number;
  completedTasksCount: number;
  successRate: number;
}

export class StatsService {
  /**
   * Fetch dashboard stats and update store
   */
  static async fetchStats(): Promise<StatsResponse> {
    try {
      useAppStore.getState().setLoading(true);
      
      const response = await apiRequest('GET', '/api/analytics/stats');
      const data = await response.json() as StatsResponse;
      
      // Update store with fetched stats
      useAppStore.getState().setStats(data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      
      // Set default stats on error
      const defaultStats = {
        activeGoalsCount: 0,
        completedTasksCount: 0,
        successRate: 0
      };
      useAppStore.getState().setStats(defaultStats);
      
      throw error;
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Refresh stats data
   */
  static async refreshStats(): Promise<void> {
    await this.fetchStats();
  }
}
