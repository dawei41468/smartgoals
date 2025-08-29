import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

// Clear any cached modules
vi.resetModules()

describe('LoadingSpinner Component', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin', 'w-6', 'h-6')
    expect(spinner).toHaveAttribute('aria-label', 'Loading...')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)

    let spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-4', 'h-4')

    rerender(<LoadingSpinner size="md" />)
    spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-6', 'h-6')

    rerender(<LoadingSpinner size="lg" />)
    spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-8', 'h-8')
  })

  it('renders with custom className', () => {
    render(<LoadingSpinner className="text-blue-500" />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('text-blue-500')
  })

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading...')
  })

  it('supports custom aria-label', () => {
    render(<LoadingSpinner aria-label="Processing data..." />)

    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', 'Processing data...')
  })
})
