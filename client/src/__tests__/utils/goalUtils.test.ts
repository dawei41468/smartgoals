import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getStatusColor,
  getPriorityColor,
  calculateGoalProgress,
  calculateWeeklyProgress,
  getTotalEstimatedHours,
  getCompletedTasksCount,
  getTotalTasksCount,
  isGoalOverdue,
  getNextIncompleteTask,
  sortGoals,
  filterGoals,
  getStatusDisplayText,
  getPriorityDisplayText,
  validateGoalData
} from '../../lib/goalUtils'

describe('Goal Utilities', () => {
  describe('getStatusColor', () => {
    it('should return correct color for active status', () => {
      const result = getStatusColor('active')
      expect(result).toContain('bg-blue-100')
      expect(result).toContain('text-blue-800')
    })

    it('should return correct color for completed status', () => {
      const result = getStatusColor('completed')
      expect(result).toContain('bg-green-100')
      expect(result).toContain('text-green-800')
    })

    it('should return default color for unknown status', () => {
      const result = getStatusColor('unknown')
      expect(result).toContain('bg-gray-100')
      expect(result).toContain('text-gray-800')
    })

    it('should return default color for null/undefined status', () => {
      expect(getStatusColor(null)).toContain('bg-gray-100')
      expect(getStatusColor(undefined)).toContain('bg-gray-100')
    })
  })

  describe('getPriorityColor', () => {
    it('should return correct color for high priority', () => {
      const result = getPriorityColor('high')
      expect(result).toContain('bg-red-100')
      expect(result).toContain('text-red-800')
    })

    it('should return correct color for medium priority', () => {
      const result = getPriorityColor('medium')
      expect(result).toContain('bg-yellow-100')
      expect(result).toContain('text-yellow-800')
    })

    it('should return correct color for low priority', () => {
      const result = getPriorityColor('low')
      expect(result).toContain('bg-green-100')
      expect(result).toContain('text-green-800')
    })
  })

  describe('calculateGoalProgress', () => {
    it('should calculate progress correctly', () => {
      const weeklyGoals = [
        {
          tasks: [
            { completed: true },
            { completed: false },
            { completed: true }
          ]
        },
        {
          tasks: [
            { completed: true },
            { completed: true }
          ]
        }
      ]

      const result = calculateGoalProgress(weeklyGoals)
      expect(result).toBe(80) // 5 completed out of 6 total = 83%, rounded to 80
    })

    it('should return 0 for empty tasks', () => {
      const result = calculateGoalProgress([])
      expect(result).toBe(0)
    })

    it('should return 0 when no tasks exist', () => {
      const result = calculateGoalProgress([{ tasks: [] }])
      expect(result).toBe(0)
    })
  })

  describe('calculateWeeklyProgress', () => {
    it('should calculate weekly progress correctly', () => {
      const tasks = [
        { completed: true },
        { completed: false },
        { completed: true }
      ]

      const result = calculateWeeklyProgress(tasks)
      expect(result).toBe(67) // 2 out of 3 completed = 67%
    })

    it('should return 0 for empty tasks array', () => {
      const result = calculateWeeklyProgress([])
      expect(result).toBe(0)
    })
  })

  describe('getTotalEstimatedHours', () => {
    it('should sum up all estimated hours', () => {
      const weeklyGoals = [
        {
          tasks: [
            { estimatedHours: 2 },
            { estimatedHours: 1.5 }
          ]
        },
        {
          tasks: [
            { estimatedHours: 3 },
            { estimatedHours: undefined }
          ]
        }
      ]

      const result = getTotalEstimatedHours(weeklyGoals)
      expect(result).toBe(6.5)
    })

    it('should handle missing estimated hours', () => {
      const weeklyGoals = [
        {
          tasks: [
            { estimatedHours: 2 },
            {}
          ]
        }
      ]

      const result = getTotalEstimatedHours(weeklyGoals)
      expect(result).toBe(2)
    })
  })

  describe('getCompletedTasksCount', () => {
    it('should count completed tasks correctly', () => {
      const weeklyGoals = [
        {
          tasks: [
            { completed: true },
            { completed: false },
            { completed: true }
          ]
        },
        {
          tasks: [
            { completed: true }
          ]
        }
      ]

      const result = getCompletedTasksCount(weeklyGoals)
      expect(result).toBe(3)
    })

    it('should handle undefined completed property', () => {
      const weeklyGoals = [
        {
          tasks: [
            { completed: true },
            {}
          ]
        }
      ]

      const result = getCompletedTasksCount(weeklyGoals)
      expect(result).toBe(1)
    })
  })

  describe('getTotalTasksCount', () => {
    it('should count all tasks correctly', () => {
      const weeklyGoals = [
        { tasks: [{}, {}, {}] },
        { tasks: [{}, {}] }
      ]

      const result = getTotalTasksCount(weeklyGoals)
      expect(result).toBe(5)
    })

    it('should handle missing tasks array', () => {
      const weeklyGoals = [
        {},
        { tasks: [{}, {}] }
      ]

      const result = getTotalTasksCount(weeklyGoals)
      expect(result).toBe(2)
    })
  })

  describe('isGoalOverdue', () => {
    beforeEach(() => {
      // Mock current date to a fixed date
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should return false for completed goals', () => {
      const result = isGoalOverdue('2024-01-10', 'completed')
      expect(result).toBe(false)
    })

    it('should return true for overdue goals', () => {
      const result = isGoalOverdue('2024-01-10', 'active')
      expect(result).toBe(true)
    })

    it('should return false for future deadlines', () => {
      const result = isGoalOverdue('2024-01-20', 'active')
      expect(result).toBe(false)
    })

    it('should return false for null deadline', () => {
      const result = isGoalOverdue(null, 'active')
      expect(result).toBe(false)
    })
  })

  describe('getNextIncompleteTask', () => {
    it('should return the first incomplete task', () => {
      const weeklyGoals = [
        {
          tasks: [
            { title: 'Task 1', completed: true },
            { title: 'Task 2', completed: false, priority: 'high', day: 1 }
          ]
        }
      ]

      const result = getNextIncompleteTask(weeklyGoals)
      expect(result).toEqual({
        title: 'Task 2',
        priority: 'high',
        day: 1
      })
    })

    it('should return null when all tasks are complete', () => {
      const weeklyGoals = [
        {
          tasks: [
            { title: 'Task 1', completed: true },
            { title: 'Task 2', completed: true }
          ]
        }
      ]

      const result = getNextIncompleteTask(weeklyGoals)
      expect(result).toBe(null)
    })

    it('should handle missing tasks array', () => {
      const weeklyGoals = [{}]
      const result = getNextIncompleteTask(weeklyGoals)
      expect(result).toBe(null)
    })
  })

  describe('sortGoals', () => {
    const goals = [
      { title: 'Goal B', progress: 50, deadline: '2024-02-01', createdAt: '2024-01-01' },
      { title: 'Goal A', progress: 80, deadline: '2024-01-15', createdAt: '2024-01-02' }
    ]

    it('should sort by progress descending', () => {
      const result = sortGoals(goals, 'progress')
      expect(result[0].progress).toBe(80)
      expect(result[1].progress).toBe(50)
    })

    it('should sort by title ascending', () => {
      const result = sortGoals(goals, 'title')
      expect(result[0].title).toBe('Goal A')
      expect(result[1].title).toBe('Goal B')
    })

    it('should sort by deadline ascending', () => {
      const result = sortGoals(goals, 'deadline')
      expect(result[0].deadline).toBe('2024-01-15')
      expect(result[1].deadline).toBe('2024-02-01')
    })

    it('should sort by created date descending (newest first)', () => {
      const result = sortGoals(goals, 'created')
      expect(result[0].createdAt).toBe('2024-01-02')
      expect(result[1].createdAt).toBe('2024-01-01')
    })
  })

  describe('filterGoals', () => {
    const goals = [
      { title: 'Health Goal', description: 'Get fit', status: 'active' },
      { title: 'Work Goal', description: 'Complete project', status: 'completed' },
      { title: 'Personal Goal', description: 'Learn guitar', status: 'active' }
    ]

    it('should filter by status', () => {
      const result = filterGoals(goals, 'active', '')
      expect(result).toHaveLength(2)
      expect(result.every(goal => goal.status === 'active')).toBe(true)
    })

    it('should filter by search query', () => {
      const result = filterGoals(goals, 'all', 'Health')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Health Goal')
    })

    it('should filter by both status and search', () => {
      const result = filterGoals(goals, 'active', 'Personal')
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Personal Goal')
    })

    it('should return all goals when no filters', () => {
      const result = filterGoals(goals, 'all', '')
      expect(result).toHaveLength(3)
    })
  })

  describe('getStatusDisplayText', () => {
    it('should capitalize status text', () => {
      expect(getStatusDisplayText('active')).toBe('Active')
      expect(getStatusDisplayText('completed')).toBe('Completed')
      expect(getStatusDisplayText('paused')).toBe('Paused')
    })

    it('should handle null/undefined status', () => {
      expect(getStatusDisplayText(null)).toBe('Unknown')
      expect(getStatusDisplayText(undefined)).toBe('Unknown')
    })
  })

  describe('getPriorityDisplayText', () => {
    it('should capitalize priority text', () => {
      expect(getPriorityDisplayText('high')).toBe('High')
      expect(getPriorityDisplayText('medium')).toBe('Medium')
      expect(getPriorityDisplayText('low')).toBe('Low')
    })

    it('should return Medium for null/undefined priority', () => {
      expect(getPriorityDisplayText(null)).toBe('Medium')
      expect(getPriorityDisplayText(undefined)).toBe('Medium')
    })
  })

  describe('validateGoalData', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });
    it('should validate complete goal data', () => {
      const validData = {
        title: 'Test Goal',
        specific: 'Specific criteria',
        measurable: 'Measurable criteria',
        achievable: 'Achievable criteria',
        relevant: 'Relevant criteria',
        timebound: 'Timebound criteria',
        exciting: 'Exciting criteria',
        deadline: '2024-02-01'
      }

      const result = validateGoalData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect missing required fields', () => {
      const invalidData = {
        title: '',
        specific: '',
        measurable: '',
        deadline: '2024-01-01' // Past date
      }

      const result = validateGoalData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Title is required')
      expect(result.errors).toContain('Specific criteria is required')
      expect(result.errors).toContain('Measurable criteria is required')
      expect(result.errors).toContain('Deadline must be in the future')
    })

    it('should validate future deadline', () => {
      const pastDeadlineData = {
        title: 'Test Goal',
        specific: 'Specific',
        measurable: 'Measurable',
        deadline: '2023-01-01' // Past date
      }

      const result = validateGoalData(pastDeadlineData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Deadline must be in the future')
    })

    it('should handle invalid date format', () => {
      const invalidDateData = {
        title: 'Test Goal',
        specific: 'Specific',
        measurable: 'Measurable',
        deadline: 'invalid-date'
      }

      const result = validateGoalData(invalidDateData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid deadline format')
    })
  })
})
