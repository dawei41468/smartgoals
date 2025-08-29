import { render, RenderOptions } from '@testing-library/react'
import React, { ReactElement } from 'react'

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const createMockGoal = (overrides = {}) => ({
  id: 'test-goal-id',
  userId: 'test-user-id',
  title: 'Test Goal',
  description: 'Test description',
  category: 'Health',
  specific: 'Test specific',
  measurable: 'Test measurable',
  achievable: 'Test achievable',
  relevant: 'Test relevant',
  timebound: 'Test timebound',
  exciting: 'Test exciting',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  bio: 'Test bio',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

export const mockApiError = (message: string, status = 400) => ({
  ok: false,
  status,
  json: () => Promise.reject(new Error(message)),
  text: () => Promise.reject(new Error(message)),
})
