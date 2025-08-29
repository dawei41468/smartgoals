import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { Button } from '../../../components/ui/button'
import userEvent from '@testing-library/user-event'

describe('Button Component', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>)

    let button = screen.getByRole('button', { name: /delete/i })
    expect(button).toHaveClass('bg-destructive')

    rerender(<Button variant="outline">Outline</Button>)
    button = screen.getByRole('button', { name: /outline/i })
    expect(button).toHaveClass('border', 'border-input')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button', { name: /ghost/i })
    expect(button).toHaveClass('hover:bg-accent')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)

    let button = screen.getByRole('button', { name: /small/i })
    expect(button).toHaveClass('h-9', 'px-3')

    rerender(<Button size="lg">Large</Button>)
    button = screen.getByRole('button', { name: /large/i })
    expect(button).toHaveClass('h-11', 'px-8')

    rerender(<Button size="icon">🎯</Button>)
    button = screen.getByRole('button', { name: /🎯/i })
    expect(button).toHaveClass('h-10', 'w-10')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button disabled onClick={handleClick}>Disabled</Button>)

    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('forwards additional props', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>)

    const button = screen.getByTestId('submit-btn')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
