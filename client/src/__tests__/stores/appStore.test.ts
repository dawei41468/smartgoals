import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppStore } from '../../stores/appStore'

// Mock the persist middleware to avoid localStorage issues in tests
vi.mock('zustand/middleware', () => ({
  persist: (config: any) => config,
  devtools: (config: any) => config,
}))

const initialState = useAppStore.getState()

describe('App Store', () => {
  beforeEach(() => {
    useAppStore.setState(initialState, true)
  })

  it('provides default state', () => {
    const { result } = renderHook(() => useAppStore())

    expect(result.current.currentView).toBe('dashboard')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.activeGoalId).toBe(null)
    expect(result.current.goals).toEqual([])
    expect(result.current.activities).toEqual([])
  })

  it('can set current view', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setCurrentView('wizard')
    })

    expect(result.current.currentView).toBe('wizard')
  })

  it('can toggle loading state', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('can set active goal ID', () => {
    const { result } = renderHook(() => useAppStore())

    act(() => {
      result.current.setActiveGoalId('goal-123')
    })

    expect(result.current.activeGoalId).toBe('goal-123')
  })

  it('can add goals', () => {
    const { result } = renderHook(() => useAppStore())

    const newGoal = {
      id: 'goal-1',
      title: 'Test Goal',
      status: 'active' as const,
      userId: 'user-1',
      category: 'Health',
      specific: 'Test specific',
      measurable: 'Test measurable',
      achievable: 'Test achievable',
      relevant: 'Test relevant',
      timebound: 'Test timebound',
      exciting: 'Test exciting',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    act(() => {
      result.current.addGoal(newGoal)
    })

    expect(result.current.goals).toHaveLength(1)
    expect(result.current.goals[0]).toEqual(newGoal)
  })

  it('can update goals', () => {
    const { result } = renderHook(() => useAppStore())

    const initialGoal = {
      id: 'goal-1',
      title: 'Original Title',
      status: 'active' as const,
      userId: 'user-1',
      category: 'Health',
      specific: 'Test specific',
      measurable: 'Test measurable',
      achievable: 'Test achievable',
      relevant: 'Test relevant',
      timebound: 'Test timebound',
      exciting: 'Test exciting',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    act(() => {
      result.current.addGoal(initialGoal)
      result.current.updateGoal('goal-1', {
        title: 'Updated Title',
        status: 'completed'
      })
    })

    expect(result.current.goals[0].title).toBe('Updated Title')
    expect(result.current.goals[0].status).toBe('completed')
  })

  it('can remove goals', () => {
    const { result } = renderHook(() => useAppStore())

    const goal = {
      id: 'goal-1',
      title: 'Test Goal',
      status: 'active' as const,
      userId: 'user-1',
      category: 'Health',
      specific: 'Test specific',
      measurable: 'Test measurable',
      achievable: 'Test achievable',
      relevant: 'Test relevant',
      timebound: 'Test timebound',
      exciting: 'Test exciting',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    }

    act(() => {
      result.current.addGoal(goal)
      result.current.removeGoal('goal-1')
    })

    expect(result.current.goals).toHaveLength(0)
  })

  it('can add activities', () => {
    const { result } = renderHook(() => useAppStore())

    const activity = {
      id: 'activity-1',
      userId: 'user-1',
      goalId: 'goal-1',
      type: 'goal_created',
      message: 'Goal created',
      createdAt: '2024-01-01T00:00:00Z'
    }

    act(() => {
      result.current.addActivity(activity)
    })

    expect(result.current.activities).toHaveLength(1)
    expect(result.current.activities[0]).toEqual(activity)
  })

  it('can set stats', () => {
    const { result } = renderHook(() => useAppStore())

    const stats = {
      activeGoalsCount: 5,
      completedTasksCount: 25,
      successRate: 80
    }

    act(() => {
      result.current.setStats(stats)
    })

    expect(result.current.stats).toEqual(stats)
  })

  it('can reset store', () => {
    const { result } = renderHook(() => useAppStore())

    // Add some data
    act(() => {
      result.current.setCurrentView('wizard')
      result.current.setLoading(true)
      result.current.addGoal({
        id: 'goal-1',
        title: 'Test Goal',
        status: 'active' as const,
        userId: 'user-1',
        category: 'Health',
        specific: 'Test specific',
        measurable: 'Test measurable',
        achievable: 'Test achievable',
        relevant: 'Test relevant',
        timebound: 'Test timebound',
        exciting: 'Test exciting',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      })
    })

    // Verify data exists
    expect(result.current.currentView).toBe('wizard')
    expect(result.current.isLoading).toBe(true)
    expect(result.current.goals).toHaveLength(1)

    // Reset store
    act(() => {
      result.current.reset()
    })

    // Verify reset
    expect(result.current.currentView).toBe('dashboard')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.goals).toHaveLength(0)
  })
})
