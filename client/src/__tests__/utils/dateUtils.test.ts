import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  formatDate, 
  formatDateLong, 
  getDaysUntilDeadline, 
  getWeeksUntilDeadline, 
  formatTimeAgo, 
  isOverdue, 
  getDayName, 
  getCurrentISODate, 
  addDays, 
  addWeeks 
} from '../../lib/dateUtils'

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('formats date string correctly', () => {
      const dateStr = '2024-01-15T10:30:00Z'
      const result = formatDate(dateStr)

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toMatch(/Jan 15, 2024/) // Expected format
    })

    it('returns empty string for null/undefined date', () => {
      expect(formatDate(null)).toBe('')
      expect(formatDate(undefined)).toBe('')
    })

    it('handles invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date'
      const result = formatDate(invalidDate)
      expect(result).toBe('')
    })
  })

  describe('formatDateLong', () => {
    it('formats date with full month name', () => {
      const dateStr = '2024-01-15T10:30:00Z'
      const result = formatDateLong(dateStr)

      expect(result).toBeDefined()
      expect(result).toMatch(/January 15, 2024/) // Expected format
    })

    it('returns empty string for null/undefined date', () => {
      expect(formatDateLong(null)).toBe('')
      expect(formatDateLong(undefined)).toBe('')
    })
  })

  describe('getDaysUntilDeadline', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('calculates days until future deadline', () => {
      const futureDate = '2024-01-20T10:30:00Z'
      const result = getDaysUntilDeadline(futureDate)

      expect(result).toBe(5) // 5 days from Jan 15 to Jan 20
    })

    it('returns 0 for past deadline', () => {
      const pastDate = '2024-01-10T10:30:00Z'
      const result = getDaysUntilDeadline(pastDate)

      expect(result).toBeLessThanOrEqual(0)
    })

    it('returns 0 for null deadline', () => {
      const result = getDaysUntilDeadline(null)
      expect(result).toBe(0)
    })
  })

  describe('getWeeksUntilDeadline', () => {
    it('calculates weeks until future deadline', () => {
      const futureDate = '2024-02-15T10:30:00Z'
      const result = getWeeksUntilDeadline(futureDate)

      expect(result).toBeGreaterThan(0)
    })

    it('returns minimum 1 week for valid dates', () => {
      const soonDate = '2024-01-16T10:30:00Z' // Tomorrow
      const result = getWeeksUntilDeadline(soonDate)

      expect(result).toBeGreaterThanOrEqual(1)
    })
  })

  describe('formatTimeAgo', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns "just now" for very recent dates', () => {
      const recentDate = new Date(Date.now() - 30 * 1000).toISOString() // 30 seconds ago
      const result = formatTimeAgo(recentDate)

      expect(result).toBe('just now')
    })

    it('formats minutes ago correctly', () => {
      const thirtyMinsAgo = '2024-01-15T11:30:00Z'
      const result = formatTimeAgo(thirtyMinsAgo)

      expect(result).toBe('30m ago')
    })

    it('formats hours ago correctly', () => {
      const twoHoursAgo = '2024-01-15T10:00:00Z'
      const result = formatTimeAgo(twoHoursAgo)

      expect(result).toBe('2h ago')
    })

    it('formats days ago correctly', () => {
      const twoDaysAgo = '2024-01-13T12:00:00Z'
      const result = formatTimeAgo(twoDaysAgo)

      expect(result).toBe('2d ago')
    })

    it('returns "just now" for null/undefined dates', () => {
      expect(formatTimeAgo(null)).toBe('just now')
      expect(formatTimeAgo(undefined)).toBe('just now')
    })
  })

  describe('isOverdue', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('returns false for future dates', () => {
      const futureDate = '2024-01-20T10:30:00Z'
      const result = isOverdue(futureDate)

      expect(result).toBe(false)
    })

    it('returns true for past dates', () => {
      const pastDate = '2024-01-10T10:30:00Z'
      const result = isOverdue(pastDate)

      expect(result).toBe(true)
    })

    it('returns false for null deadline', () => {
      const result = isOverdue(null)
      expect(result).toBe(false)
    })

    it('handles invalid date strings gracefully', () => {
      const invalidDate = 'invalid-date'
      const result = isOverdue(invalidDate)

      expect(result).toBe(false)
    })
  })

  describe('getDayName', () => {
    it('returns correct day name for valid day numbers', () => {
      expect(getDayName(1)).toBe('Monday')
      expect(getDayName(2)).toBe('Tuesday')
      expect(getDayName(3)).toBe('Wednesday')
      expect(getDayName(4)).toBe('Thursday')
      expect(getDayName(5)).toBe('Friday')
      expect(getDayName(6)).toBe('Saturday')
      expect(getDayName(7)).toBe('Sunday')
    })

    it('returns fallback for invalid day numbers', () => {
      expect(getDayName(0)).toBe('Day 0')
      expect(getDayName(8)).toBe('Day 8')
      expect(getDayName(-1)).toBe('Day -1')
    })
  })

  describe('getCurrentISODate', () => {
    it('returns valid ISO date string', () => {
      const result = getCurrentISODate()

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('addDays', () => {
    it('adds days correctly', () => {
      const baseDate = new Date('2024-01-15T12:00:00Z')
      const result = addDays(baseDate, 3)

      expect(result.getDate()).toBe(18) // Jan 15 + 3 days = Jan 18
      expect(result.getMonth()).toBe(0) // January (0-indexed)
      expect(result.getFullYear()).toBe(2024)
    })

    it('handles negative days correctly', () => {
      const baseDate = new Date('2024-01-15T12:00:00Z')
      const result = addDays(baseDate, -5)

      expect(result.getDate()).toBe(10) // Jan 15 - 5 days = Jan 10
    })

    it('handles month boundaries correctly', () => {
      const baseDate = new Date('2024-01-30T12:00:00Z')
      const result = addDays(baseDate, 5)

      expect(result.getDate()).toBe(4) // Jan 30 + 5 days = Feb 4
      expect(result.getMonth()).toBe(1) // February (0-indexed)
    })
  })

  describe('addWeeks', () => {
    it('adds weeks correctly', () => {
      const baseDate = new Date('2024-01-15T12:00:00Z')
      const result = addWeeks(baseDate, 2)

      expect(result.getDate()).toBe(29) // Jan 15 + 14 days = Jan 29
      expect(result.getMonth()).toBe(0) // January
    })

    it('handles month boundaries correctly', () => {
      const baseDate = new Date('2024-01-25T12:00:00Z')
      const result = addWeeks(baseDate, 1)

      expect(result.getDate()).toBe(1) // Jan 25 + 7 days = Feb 1
      expect(result.getMonth()).toBe(1) // February
    })
  })
})
