import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext'

// Mock the i18n module
vi.mock('../../lib/i18n', () => ({
  translations: {
    en: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        loading: 'Loading...'
      },
      dashboard: {
        title: 'Dashboard',
        welcome: 'Welcome to SmartGoals'
      }
    },
    zh: {
      common: {
        save: '保存',
        cancel: '取消',
        loading: '加载中...'
      },
      dashboard: {
        title: '仪表盘',
        welcome: '欢迎使用 SmartGoals'
      }
    }
  }
}))

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: null })
}))

// Mock queryClient
vi.mock('../../lib/queryClient', () => ({
  apiRequest: vi.fn()
}))

describe('LanguageContext', () => {
  it('provides default language as English', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    expect(result.current.language).toBe('en')
  })

  it('provides translation function', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    expect(result.current.t).toBeDefined()
    expect(typeof result.current.t).toBe('function')
  })

  it('translates keys correctly in English', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    expect(result.current.t('common.save')).toBe('Save')
    expect(result.current.t('common.cancel')).toBe('Cancel')
    expect(result.current.t('dashboard.welcome')).toBe('Welcome to SmartGoals')
  })

  it('returns key if translation not found', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key')
    expect(result.current.t('')).toBe('')
  })

  it('can change language', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    act(() => {
      result.current.setLanguage('zh')
    })

    expect(result.current.language).toBe('zh')
  })

  it('translates keys correctly after language change', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    // Default English
    expect(result.current.t('common.save')).toBe('Save')

    // Change to Chinese
    act(() => {
      result.current.setLanguage('zh')
    })

    expect(result.current.t('common.save')).toBe('保存')
    expect(result.current.t('dashboard.title')).toBe('仪表盘')
  })

  it('handles nested translation keys', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    expect(result.current.t('common.loading')).toBe('Loading...')
    expect(result.current.t('dashboard.welcome')).toBe('Welcome to SmartGoals')
  })

  it('handles language change and maintains translations', () => {
    const { result } = renderHook(() => useLanguage(), {
      wrapper: LanguageProvider
    })

    // Start with English
    expect(result.current.t('common.cancel')).toBe('Cancel')

    // Change to Chinese
    act(() => {
      result.current.setLanguage('zh')
    })

    expect(result.current.t('common.cancel')).toBe('取消')

    // Change back to English
    act(() => {
      result.current.setLanguage('en' as const)
    })

    expect(result.current.t('common.cancel')).toBe('Cancel')
  })
})
