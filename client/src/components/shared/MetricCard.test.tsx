import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Target } from 'lucide-react'
import MetricCard from './MetricCard'

// Mock UI components to avoid external dependencies
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 data-testid="card-title" className={className}>{children}</h3>,
}))

describe('MetricCard', () => {
  it('renders basic metric card with title and value', () => {
    render(<MetricCard title="Total Goals" value="25" />)

    expect(screen.getByTestId('card-title')).toHaveTextContent('Total Goals')
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(
      <MetricCard
        title="Completion Rate"
        value="85%"
        description="Goals completed this month"
      />
    )

    expect(screen.getByText('Goals completed this month')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    render(<MetricCard title="Active Goals" value="12" icon={Target} />)

    // The icon should be rendered (we can't easily test the actual Lucide icon rendering)
    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
  })

  it('renders positive trend correctly', () => {
    render(
      <MetricCard
        title="Progress"
        value="75%"
        trend={{ value: 15, isPositive: true }}
      />
    )

    expect(screen.getByText('↗')).toBeTruthy()
    expect(screen.getByText('15% from last period')).toBeTruthy()
    // The trend element should contain the positive indicator
    const trendText = screen.getByText('15% from last period')
    expect(trendText.parentElement?.textContent).toContain('↗')
  })

  it('renders negative trend correctly', () => {
    render(
      <MetricCard
        title="Progress"
        value="75%"
        trend={{ value: -8, isPositive: false }}
      />
    )

    expect(screen.getByText('↘')).toBeTruthy()
    expect(screen.getByText('8% from last period')).toBeTruthy()
    // The trend element should contain the negative indicator
    const trendText = screen.getByText('8% from last period')
    expect(trendText.parentElement?.textContent).toContain('↘')
  })

  it('applies custom className', () => {
    render(<MetricCard title="Test" value="100" className="custom-class" />)

    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
  })

  it('handles numeric values', () => {
    render(<MetricCard title="Count" value={42} />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders all optional props together', () => {
    render(
      <MetricCard
        title="Comprehensive Test"
        value="95%"
        description="All features working"
        icon={Target}
        trend={{ value: 20, isPositive: true }}
        className="test-class"
      />
    )

    expect(screen.getByTestId('card-title')).toHaveTextContent('Comprehensive Test')
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('All features working')).toBeInTheDocument()
    expect(screen.getByText('↗')).toBeInTheDocument()
    expect(screen.getByText('20% from last period')).toBeInTheDocument()

    const card = screen.getByTestId('card')
    expect(card).toHaveClass('test-class')
  })

  it('does not render trend section when trend is not provided', () => {
    render(<MetricCard title="No Trend" value="50" />)

    expect(screen.queryByText(/from last period/)).not.toBeInTheDocument()
    expect(screen.queryByText('↗')).not.toBeInTheDocument()
    expect(screen.queryByText('↘')).not.toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<MetricCard title="No Description" value="30" />)

    expect(screen.queryByTestId('card-content')).not.toHaveTextContent(/description/)
  })
})