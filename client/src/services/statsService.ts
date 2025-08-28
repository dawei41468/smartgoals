import { apiRequest } from '@/lib/queryClient';
import { useAppStore } from '@/stores/appStore';

export interface StatsResponse {
  activeGoalsCount: number;
  completedTasksCount: number;
  successRate: number;
}

export interface AnalyticsSummaryResponse {
  goalSuccessRate: number;
  avgCompletionTime: number;
  totalGoalsCreated: number;
  completedGoals: number;
  activeGoals: number;
  pausedGoals: number;
  totalTasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  bestPerformingDay: string;
  mostProductiveHour: number;
  weeklyProgressTrend: number[];
  monthlyComparison: {
    thisMonth: number;
    lastMonth: number;
    change: number;
  };
}

export interface CategoryPerformanceResponse {
  name: string;
  count: number;
  successRate: number;
  avgTimeToComplete: number;
}

export interface ProductivityPatternResponse {
  dayOfWeek: string;
  completionRate: number;
  tasksCompleted: number;
}

export class StatsService {
  /**
   * Fetch dashboard stats and update store
   */
  static async fetchStats(): Promise<StatsResponse> {
    try {
      useAppStore.getState().setLoading(true);
      
      const response = await apiRequest('GET', '/api/analytics/stats');
      const result = await response.json();
      
      // Handle new standardized response format
      const data = result.success ? result.data : result;
      
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

  /**
   * Fetch all analytics data in one call
   */
  static async fetchAllAnalyticsData(): Promise<void> {
    try {
      useAppStore.getState().setLoading(true);
      
      // Fetch all analytics data in parallel
      await Promise.all([
        this.fetchAnalyticsSummary(),
        this.fetchCategoryPerformance(),
        this.fetchProductivityPatterns()
      ]);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      throw error;
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Fetch comprehensive analytics summary and update store
   */
  static async fetchAnalyticsSummary(): Promise<AnalyticsSummaryResponse> {
    try {
      const response = await apiRequest('GET', '/api/analytics/summary');
      const result = await response.json();
      
      // Handle new standardized response format
      const data = result.success ? result.data : result;
      
      // Update store with analytics data
      useAppStore.getState().setAnalyticsSummary(data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch analytics summary:', error);
      
      // Set fallback data on error
      const fallbackData: AnalyticsSummaryResponse = {
        goalSuccessRate: 0,
        avgCompletionTime: 0,
        totalGoalsCreated: 0,
        completedGoals: 0,
        activeGoals: 0,
        pausedGoals: 0,
        totalTasksCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        bestPerformingDay: "Monday",
        mostProductiveHour: 10,
        weeklyProgressTrend: [0, 0, 0, 0, 0, 0, 0],
        monthlyComparison: { thisMonth: 0, lastMonth: 0, change: 0 }
      };
      useAppStore.getState().setAnalyticsSummary(fallbackData);
      
      throw error;
    }
  }

  /**
   * Fetch category performance data and update store
   */
  static async fetchCategoryPerformance(): Promise<CategoryPerformanceResponse[]> {
    try {
      const response = await apiRequest('GET', '/api/analytics/categories');
      const result = await response.json();
      
      // Handle new standardized response format
      const data = result.success ? result.data : result;
      
      // Update store with category data
      useAppStore.getState().setCategoryPerformance(data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch category performance:', error);
      
      // Set empty array on error
      useAppStore.getState().setCategoryPerformance([]);
      
      throw error;
    }
  }

  /**
   * Fetch productivity patterns and update store
   */
  static async fetchProductivityPatterns(): Promise<ProductivityPatternResponse[]> {
    try {
      const response = await apiRequest('GET', '/api/analytics/patterns');
      const result = await response.json();
      
      // Handle new standardized response format
      const data = result.success ? result.data : result;
      
      // Update store with productivity data
      useAppStore.getState().setProductivityPatterns(data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch productivity patterns:', error);
      
      // Set empty array on error
      useAppStore.getState().setProductivityPatterns([]);
      
      throw error;
    }
  }
}
