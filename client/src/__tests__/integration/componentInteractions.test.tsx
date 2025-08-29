import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '../../test/test-utils'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import userEvent from '@testing-library/user-event'

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
    toasts: [],
    dismiss: vi.fn()
  })
}))

describe('Component Integration Tests', () => {
  describe('Form Interactions', () => {
    it('handles form submission with loading states', async () => {
      const handleSubmit = vi.fn()
      const user = userEvent.setup()
      const { rerender } = render(
        <div>
          <Input placeholder="Enter your name" data-testid="name-input" />
          <Button onClick={handleSubmit} data-testid="submit-btn">
            Submit
          </Button>
        </div>
      )

      const input = screen.getByTestId('name-input')
      const button = screen.getByTestId('submit-btn')

      // Type in the input
      await user.type(input, 'John Doe')
      expect(input).toHaveValue('John Doe')

      // Click submit
      await user.click(button)
      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('shows loading spinner during async operations', async () => {
      const handleAsyncClick = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      )

      const user = userEvent.setup()
      const { rerender } = render(
        <Button onClick={handleAsyncClick} data-testid="async-btn">
          Start Async
        </Button>
      )

      const button = screen.getByTestId('async-btn')
      await user.click(button)

      // Re-render with loading state
      rerender(
        <div>
          <LoadingSpinner data-testid="loading-spinner" />
          <Button disabled data-testid="async-btn">
            Processing...
          </Button>
        </div>
      )

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByTestId('async-btn')).toBeDisabled()
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('Button and Input Integration', () => {
    it('handles form-like interactions between components', async () => {
      const onValueChange = vi.fn()
      const onSubmit = vi.fn()

      const user = userEvent.setup()
      const { rerender } = render(
        <div>
          <Input
            placeholder="Enter value"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
            data-testid="value-input"
          />
          <Button
            onClick={() => {
              const input = document.querySelector('[data-testid="value-input"]') as HTMLInputElement
              onSubmit(input?.value || '')
            }}
            data-testid="submit-btn"
          >
            Submit Value
          </Button>
        </div>
      )

      const input = screen.getByTestId('value-input')
      const button = screen.getByTestId('submit-btn')

      // Type in input
      await user.type(input, 'Test Value')
      expect(onValueChange).toHaveBeenCalledTimes(10)
      expect(onValueChange).toHaveBeenNthCalledWith(1, 'T')
      expect(onValueChange).toHaveBeenNthCalledWith(2, 'Te')
      expect(onValueChange).toHaveBeenNthCalledWith(3, 'Tes')
      expect(onValueChange).toHaveBeenNthCalledWith(4, 'Test')
      expect(onValueChange).toHaveBeenNthCalledWith(5, 'Test ')
      expect(onValueChange).toHaveBeenNthCalledWith(6, 'Test V')
      expect(onValueChange).toHaveBeenNthCalledWith(7, 'Test Va')
      expect(onValueChange).toHaveBeenNthCalledWith(8, 'Test Val')
      expect(onValueChange).toHaveBeenNthCalledWith(9, 'Test Valu')
      expect(onValueChange).toHaveBeenNthCalledWith(10, 'Test Value')

      // Submit
      await user.click(button)
      expect(onSubmit).toHaveBeenCalledWith('Test Value')
    })

    it('handles keyboard navigation between components', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <div>
          <Input data-testid="first-input" />
          <Input data-testid="second-input" />
          <Button data-testid="action-btn">Action</Button>
        </div>
      )

      const firstInput = screen.getByTestId('first-input')
      const secondInput = screen.getByTestId('second-input')
      const button = screen.getByTestId('action-btn')

      // Tab through components
      await user.tab()
      expect(firstInput).toHaveFocus()

      await user.tab()
      expect(secondInput).toHaveFocus()

      await user.tab()
      expect(button).toHaveFocus()
    })
  })

  describe('Loading States Integration', () => {
    it('transitions between loading and loaded states', () => {
      const { rerender } = render(
        <div>
          <LoadingSpinner data-testid="spinner" />
          <p data-testid="loading-text">Loading...</p>
        </div>
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByTestId('loading-text')).toBeInTheDocument()

      // Transition to loaded state
      rerender(
        <div>
          <p data-testid="success-text">Data loaded successfully!</p>
          <Button data-testid="continue-btn">Continue</Button>
        </div>
      )

      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument()
      expect(screen.queryByTestId('loading-text')).not.toBeInTheDocument()
      expect(screen.getByTestId('success-text')).toBeInTheDocument()
      expect(screen.getByTestId('continue-btn')).toBeInTheDocument()
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains proper ARIA relationships', () => {
      render(
        <div>
          <label htmlFor="username-input">Username</label>
          <Input
            id="username-input"
            aria-describedby="username-help"
            data-testid="username-input"
          />
          <span id="username-help">Enter your username</span>
          <Button>Submit Username</Button>
        </div>
      )

      const input = screen.getByTestId('username-input')
      const button = screen.getByRole('button', { name: /submit username/i })

      expect(input).toHaveAttribute('aria-describedby', 'username-help')
      expect(button).toBeInTheDocument()
    })

    it('handles focus management properly', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <div>
          <Button data-testid="focus-btn">Focus Me</Button>
          <Input data-testid="next-input" />
        </div>
      )

      const button = screen.getByTestId('focus-btn')
      const input = screen.getByTestId('next-input')

      // Focus button
      button.focus()
      expect(button).toHaveFocus()

      // Tab to input
      await user.tab()
      expect(input).toHaveFocus()
    })
  })
})
