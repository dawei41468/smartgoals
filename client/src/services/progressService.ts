import { apiRequest } from '@/lib/queryClient';
import { useAppStore, type ProgressStats, type Achievement } from '@/stores/appStore';
import { ErrorHandler } from '@/lib/errorHandling';

export class ProgressService {
  /**
   * Fetch progress statistics and update store
   */
  static async fetchProgressStats(): Promise<ProgressStats> {
    try {
      const response = await apiRequest('GET', '/api/progress/stats');
      const data = await response.json() as ProgressStats;
      
      // Update store with progress stats
      useAppStore.getState().setProgressStats(data);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch progress stats:', error);
      
      // Calculate fallback stats from goals in store
      const goals = useAppStore.getState().goals;
      const fallbackStats: ProgressStats = {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        totalTasks: 0, // Will be calculated from goals if needed
        completedTasks: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisWeekProgress: 0,
        avgCompletionTime: 0
      };
      
      useAppStore.getState().setProgressStats(fallbackStats);
      throw error;
    }
  }

  /**
   * Fetch achievements and update store
   */
  static async fetchAchievements(): Promise<Achievement[]> {
    try {
      const response = await apiRequest('GET', '/api/progress/achievements');
      const data = await response.json();
      const achievements = data.achievements || [];
      
      // Update store with achievements
      useAppStore.getState().setAchievements(achievements);
      
      return achievements;
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      
      // Set empty array on error
      useAppStore.getState().setAchievements([]);
      throw error;
    }
  }

  /**
   * Fetch all progress data in one call
   */
  static async fetchAllProgressData(): Promise<void> {
    try {
      useAppStore.getState().setLoading(true);
      
      // Fetch all progress data in parallel
      await Promise.all([
        this.fetchProgressStats(),
        this.fetchAchievements()
      ]);
    } catch (error) {
      console.error('Failed to fetch progress data:', error);
      throw error;
    } finally {
      useAppStore.getState().setLoading(false);
    }
  }

  /**
   * Generate mock achievements based on current progress
   */
  static generateMockAchievements(progressStats: ProgressStats | null): Achievement[] {
    if (!progressStats) return [];

    return [
      {
        id: "first-goal",
        title: "Goal Setter",
        description: "Created your first SMART goal",
        icon: "🎯",
        unlockedAt: progressStats.totalGoals > 0 ? new Date().toISOString() : undefined,
      },
      {
        id: "week-warrior",
        title: "Week Warrior",
        description: "Complete all tasks for a full week",
        icon: "⚡",
        progress: progressStats.currentStreak,
        target: 7,
      },
      {
        id: "goal-achiever",
        title: "Goal Achiever",
        description: "Complete your first goal",
        icon: "🏆",
        unlockedAt: progressStats.completedGoals > 0 ? new Date().toISOString() : undefined,
      },
      {
        id: "consistency-king",
        title: "Consistency King",
        description: "Maintain a 14-day streak",
        icon: "🔥",
        progress: progressStats.currentStreak,
        target: 14,
        unlockedAt: progressStats.currentStreak >= 7 ? new Date().toISOString() : undefined,
      },
      {
        id: "productive-month",
        title: "Productive Month",
        description: "Complete 50 tasks in a month",
        icon: "💫",
        progress: progressStats.completedTasks,
        target: 50,
      },
    ];
  }
}
