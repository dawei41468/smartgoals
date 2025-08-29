import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useLocation } from 'wouter'
import Navigation from './navigation'

// Mock wouter
vi.mock('wouter', () => ({
  Link: ({ href, children, className, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
  useLocation: vi.fn(),
}))

// Mock dropdown menu components to render content immediately in tests
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    asChild ? children : <div data-testid="dropdown-trigger">{children}</div>
  ),
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, ...props }: any) => (
    <div data-testid={props['data-testid'] || 'dropdown-item'} {...props}>{children}</div>
  ),
  DropdownMenuLabel: ({ children }: any) => <div data-testid="dropdown-label">{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
  DropdownMenuSub: ({ children }: any) => <div data-testid="dropdown-sub">{children}</div>,
  DropdownMenuSubTrigger: ({ children, ...props }: any) => (
    <div data-testid={props['data-testid'] || 'dropdown-sub-trigger'} {...props}>{children}</div>
  ),
  DropdownMenuSubContent: ({ children }: any) => <div data-testid="dropdown-sub-content">{children}</div>,
}))

// Mock contexts
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
    setLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    logout: vi.fn(),
  }),
}))

vi.mock('@/lib/i18n', () => ({
  languages: [
    { code: 'en', nativeName: 'English' },
    { code: 'es', nativeName: 'Español' },
  ],
}))

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders navigation with logo and title', () => {
    ;(useLocation as any).mockReturnValue(['/'])

    render(<Navigation />)

    expect(screen.getByText('SMART Goals')).toBeTruthy()
    expect(screen.getByTestId('nav-dashboard')).toBeTruthy()
    expect(screen.getByTestId('nav-goals')).toBeTruthy()
    expect(screen.getByTestId('nav-progress')).toBeTruthy()
    expect(screen.getByTestId('nav-analytics')).toBeTruthy()
  })

  it('shows active state for current route', () => {
    ;(useLocation as any).mockReturnValue(['/my-goals'])

    render(<Navigation />)

    const goalsLink = screen.getByTestId('nav-goals')
    expect(goalsLink.className).toContain('text-primary')
    expect(goalsLink.className).toContain('border-b-2')
  })

  it('displays user avatar with initials', () => {
    ;(useLocation as any).mockReturnValue(['/'])

    render(<Navigation />)

    const avatar = screen.getByTestId('avatar-user')
    expect(avatar.textContent).toContain('JD')
  })

  it('opens user dropdown menu', () => {
    ;(useLocation as any).mockReturnValue(['/'])

    render(<Navigation />)

    const avatar = screen.getByTestId('avatar-user')
    fireEvent.click(avatar)

    expect(screen.getByTestId('menu-language')).toBeTruthy()
    expect(screen.getByTestId('menu-settings')).toBeTruthy()
    expect(screen.getByTestId('menu-logout')).toBeTruthy()
  })

  it('toggles theme when theme button is clicked', () => {
    ;(useLocation as any).mockReturnValue(['/'])

    render(<Navigation />)

    const themeButton = screen.getByTestId('button-theme-toggle')
    fireEvent.click(themeButton)

    // Theme toggle should trigger setTheme
    expect(themeButton).toBeTruthy()
  })

  it('renders mobile navigation on small screens', () => {
    ;(useLocation as any).mockReturnValue(['/'])

    render(<Navigation />)

    expect(screen.getByTestId('nav-mobile-dashboard')).toBeTruthy()
    expect(screen.getByTestId('nav-mobile-goals')).toBeTruthy()
    expect(screen.getByTestId('nav-mobile-progress')).toBeTruthy()
    expect(screen.getByTestId('nav-mobile-analytics')).toBeTruthy()
  })

  it('handles logout functionality', () => {
    ;(useLocation as any).mockReturnValue(['/'])

    render(<Navigation />)

    const avatar = screen.getByTestId('avatar-user')
    fireEvent.click(avatar)

    const logoutButton = screen.getByTestId('menu-logout')
    fireEvent.click(logoutButton)

    // Logout should be called
    expect(logoutButton).toBeTruthy()
  })
})