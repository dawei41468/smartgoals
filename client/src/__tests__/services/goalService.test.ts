import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GoalService } from '../../services/goalService'
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
    saveCompleteGoal: vi.fn(),
  }
}))

vi.mock('../../stores/appStore', () => ({
  useAppStore: {
    getState: vi.fn(),
    setState: vi.fn()
  }
}))

describe('GoalService', () => {
  let mockStore: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup mock store
    mockStore = {
      setLoading: vi.fn(),
      addGoal: vi.fn(),
      setGoals: vi.fn(),
      updateGoal: vi.fn(),
      removeGoal: vi.fn(),
      setActiveGoalId: vi.fn()
    }

    ;(useAppStore.getState as any).mockReturnValue(mockStore)

    // Setup mock API responses
    ;(api.createGoal as any).mockResolvedValue({
      id: 'test-goal-id',
      title: 'Test Goal',
      status: 'active'
    })

    ;(api.getGoals as any).mockResolvedValue([
      { id: 'goal1', title: 'Goal 1', status: 'active' },
      { id: 'goal2', title: 'Goal 2', status: 'completed' }
    ])

    ;(api.getDetailedGoals as any).mockResolvedValue([
      { id: 'detailed-goal1', title: 'Detailed Goal 1', status: 'active', breakdown: [] },
    ]);

    ;(api.getGoal as any).mockResolvedValue(
      { id: 'single-goal', title: 'Single Goal', status: 'active', breakdown: [] }
    );
  })

  describe('createGoal', () => {
    it('should create a goal successfully', async () => {
      const goalData = {
        title: 'New Goal',
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      const result = await GoalService.createGoal(goalData)

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.createGoal).toHaveBeenCalledWith(goalData)
      expect(mockStore.addGoal).toHaveBeenCalledWith({
        id: 'test-goal-id',
        title: 'Test Goal',
        status: 'active'
      })
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
      expect(result).toEqual({
        id: 'test-goal-id',
        title: 'Test Goal',
        status: 'active'
      })
    })

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error')
      ;(api.createGoal as any).mockRejectedValue(error)

      const goalData = {
        title: 'New Goal',
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      await expect(GoalService.createGoal(goalData)).rejects.toThrow('API Error')
      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
    })
  })

  describe('fetchGoals', () => {
    it('should fetch goals successfully', async () => {
      const result = await GoalService.fetchGoals()

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.getGoals).toHaveBeenCalled()
      expect(mockStore.setGoals).toHaveBeenCalledWith([
        { id: 'goal1', title: 'Goal 1', status: 'active' },
        { id: 'goal2', title: 'Goal 2', status: 'completed' }
      ])
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
      expect(result).toEqual([
        { id: 'goal1', title: 'Goal 1', status: 'active' },
        { id: 'goal2', title: 'Goal 2', status: 'completed' }
      ])
    })

    it('should handle fetch errors', async () => {
      const error = new Error('Network Error')
      ;(api.getGoals as any).mockRejectedValue(error)

      await expect(GoalService.fetchGoals()).rejects.toThrow('Network Error')
      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
    })
  })

    describe('createGoalDraft', () => {
    it('should create a draft goal successfully', async () => {
      const goalData = {
        title: 'Draft Goal',
        specific: 'Specific criteria'
      }

      // Mock the API response for createGoalDraft
      ;(api.createGoalDraft as any).mockResolvedValue({
        id: 'test-goal-id',
        title: 'Test Goal',
        status: 'active'
      })

      const result = await GoalService.createGoalDraft(goalData)

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.createGoalDraft).toHaveBeenCalledWith(goalData)
      expect(mockStore.addGoal).toHaveBeenCalledWith({
        id: 'test-goal-id',
        title: 'Test Goal',
        status: 'active'
      })
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
      expect(result).toEqual({
        id: 'test-goal-id',
        title: 'Test Goal',
        status: 'active'
      })
    })
  })

  describe('generateBreakdown', () => {
    beforeEach(() => {
      ;(api.generateBreakdown as any).mockResolvedValue({
        id: 'breakdown-id',
        weeks: [
          {
            weekNumber: 1,
            focus: 'Week 1 focus',
            tasks: [
              { title: 'Task 1', completed: false },
              { title: 'Task 2', completed: false }
            ]
          }
        ]
      })
    })

    it('should generate breakdown successfully', async () => {
      const breakdownRequest = {
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      const result = await GoalService.generateBreakdown(breakdownRequest)

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.generateBreakdown).toHaveBeenCalledWith(breakdownRequest)
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
      expect(result).toHaveProperty('id', 'breakdown-id')
      expect(result).toHaveProperty('weeks')
    })
  })

  describe('generateBreakdownStream', () => {
    it('should handle streaming breakdown generation', async () => {
      const mockCallback = vi.fn()
      const breakdownRequest = {
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      const goalData = {
        title: 'Streaming Goal',
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      // Mock the streaming API
      ;(api.generateBreakdownStream as any).mockImplementation(async (request: any, onProgress: any, onChunk: any) => {
        onProgress('Starting breakdown generation...', 0, 3)
        onProgress('Processing week 1...', 1, 3)
        onProgress('Processing week 2...', 2, 3)
        onProgress('Completed!', 3, 3)
        onChunk([{ weekNumber: 1, tasks: [] }])
        return { id: 'stream-breakdown-id', weeks: [] }
      })

      const result = await GoalService.generateBreakdownStream(goalData, mockCallback, vi.fn())

      expect(mockCallback).toHaveBeenCalledTimes(4)
      expect(mockCallback).toHaveBeenCalledWith('Starting breakdown generation...', 0, 3)
      expect(mockCallback).toHaveBeenCalledWith('Completed!', 3, 3)
      expect(result).toHaveProperty('id', 'stream-breakdown-id')
    })
  })

  describe('updateGoal', () => {
    beforeEach(() => {
      ;(api.updateGoal as any).mockResolvedValue({
        id: 'goal-id',
        title: 'Updated Goal',
        status: 'completed'
      })
    })

    it('should update goal successfully', async () => {
      const updates = { status: 'completed', title: 'Updated Title' }
      const result = await GoalService.updateGoal('goal-id', updates)

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.updateGoal).toHaveBeenCalledWith('goal-id', updates)
      expect(mockStore.updateGoal).toHaveBeenCalledWith('goal-id', {
        id: 'goal-id',
        title: 'Updated Goal',
        status: 'completed'
      })
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
      expect(result).toEqual({
        id: 'goal-id',
        title: 'Updated Goal',
        status: 'completed'
      })
    })
  })

  describe('deleteGoal', () => {
    beforeEach(() => {
      ;(api.deleteGoal as any).mockResolvedValue(undefined)
    })

    it('should delete goal successfully', async () => {
      await GoalService.deleteGoal('goal-id')

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.deleteGoal).toHaveBeenCalledWith('goal-id')
      expect(mockStore.removeGoal).toHaveBeenCalledWith('goal-id')
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
    })
  })

  describe('saveCompleteGoal', () => {
    it('should save complete goal with breakdown', async () => {
      const goalData = {
        title: 'Complete Goal',
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      const breakdown = {
        id: 'breakdown-id',
        weeks: [
          {
            weekNumber: 1,
            focus: 'Week 1 focus',
            tasks: [{ title: 'Task 1', completed: false }]
          }
        ]
      }

      // Mock the API response for saveCompleteGoal
      ;(api.saveCompleteGoal as any).mockResolvedValue({
        id: 'complete-goal-id',
        title: 'Complete Goal',
        status: 'active',
        weeks: []
      })

      const result = await GoalService.saveCompleteGoal(goalData, breakdown)

      expect(mockStore.setLoading).toHaveBeenCalledWith(true)
      expect(api.saveCompleteGoal).toHaveBeenCalledWith(goalData, breakdown)
      expect(mockStore.addGoal).toHaveBeenCalledWith({
        id: 'complete-goal-id',
        title: 'Complete Goal',
        status: 'active',
        weeks: []
      })
      expect(mockStore.setLoading).toHaveBeenCalledWith(false)
      expect(result).toHaveProperty('id', 'complete-goal-id')
    })
  })

  describe('fetchDetailedGoals', () => {
    it('should fetch detailed goals successfully', async () => {
      const result = await GoalService.fetchDetailedGoals();

      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(api.getDetailedGoals).toHaveBeenCalled();
      expect(mockStore.setGoals).toHaveBeenCalledWith([
        { id: 'detailed-goal1', title: 'Detailed Goal 1', status: 'active', breakdown: [] },
      ]);
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
      expect(result).toEqual([
        { id: 'detailed-goal1', title: 'Detailed Goal 1', status: 'active', breakdown: [] },
      ]);
    });
  });

  describe('fetchGoal', () => {
    it('should fetch a single goal successfully', async () => {
      const result = await GoalService.fetchGoal('single-goal');

      expect(mockStore.setLoading).toHaveBeenCalledWith(true);
      expect(api.getGoal).toHaveBeenCalledWith('single-goal');
      expect(mockStore.setActiveGoalId).toHaveBeenCalledWith('single-goal');
      expect(mockStore.setLoading).toHaveBeenCalledWith(false);
      expect(result).toEqual(
        { id: 'single-goal', title: 'Single Goal', status: 'active', breakdown: [] }
      );
    });
  });
})
