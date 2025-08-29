import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProgressService } from '../../services/progressService'
import { useAppStore } from '../../stores/appStore'
import { api } from '../../lib/api'

// Mock the API and store
vi.mock('../../lib/api', () => ({
  api: {
    createGoal: vi.fn(),
    createGoalDraft: vi.fn(),
    getGoals: vi.fn(),
    getDetailedGoals: vi.fn(),
    getGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    generateBreakdown: vi.fn(),
    generateBreakdownStream: vi.fn(),
    regenerateBreakdown: vi.fn(),
    saveCompleteGoal: vi.fn(),
    updateTask: vi.fn(),
    getStats: vi.fn(),
    getActivities: vi.fn(),
    getProgressStats: vi.fn(),
    getAchievements: vi.fn(),
  }
}))

vi.mock('../../stores/appStore', () => ({
  useAppStore: {
    getState: vi.fn(),
  }
}))

describe('ProgressService', () => {
  const fullMockStats = { totalGoals: 15, completedGoals: 10, activeGoals: 5, totalTasks: 50, completedTasks: 25, currentStreak: 3, longestStreak: 10, thisWeekProgress: 50, avgCompletionTime: 2 };

  let mockStore: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockStore = {
      setLoading: vi.fn(),
      setProgressStats: vi.fn(),
      setAchievements: vi.fn(),
      goals: [],
    }

    ;(useAppStore.getState as any).mockReturnValue(mockStore)
  })

  describe('fetchProgressStats', () => {
    it('should fetch progress stats successfully', async () => {
      (api.getProgressStats as any).mockResolvedValue(fullMockStats)

      const result = await ProgressService.fetchProgressStats();

      expect(api.getProgressStats).toHaveBeenCalled()
      expect(mockStore.setProgressStats).toHaveBeenCalledWith(fullMockStats)
      expect(result).toEqual(fullMockStats)
    })
  })

  describe('fetchAchievements', () => {
    it('should fetch achievements successfully', async () => {
      const mockAchievements = [{ id: '1', title: 'First Goal', description: 'A test achievement', icon: 'test-icon' }];
      (api.getAchievements as any).mockResolvedValue(mockAchievements)

      const result = await ProgressService.fetchAchievements();

      expect(api.getAchievements).toHaveBeenCalled()
      expect(mockStore.setAchievements).toHaveBeenCalledWith(mockAchievements)
      expect(result).toEqual(mockAchievements)
    })
  })

  describe('fetchAllProgressData', () => {
    it('should fetch all progress data concurrently', async () => {
      const mockAchievements = [{ id: '1', title: 'First Goal', description: 'A test achievement', icon: 'test-icon' }];
      (api.getProgressStats as any).mockResolvedValue(fullMockStats);
      (api.getAchievements as any).mockResolvedValue(mockAchievements);

      await ProgressService.fetchAllProgressData();

      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(api.getProgressStats).toHaveBeenCalled();
      expect(api.getAchievements).toHaveBeenCalled();
      expect(mockStore.setProgressStats).toHaveBeenCalledWith(fullMockStats);
      expect(mockStore.setAchievements).toHaveBeenCalledWith(mockAchievements);
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
    });
  });
});
