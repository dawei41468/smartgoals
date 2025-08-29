import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, reset } from '../../hooks/use-toast'

// Mock the toast components
vi.mock('../../components/ui/toast', () => ({
  Toast: ({ children }: any) => <div data-testid="toast">{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport" />,
  ToastAction: ({ children }: any) => <div data-testid="toast-action">{children}</div>,
  ToastClose: () => <button data-testid="toast-close">×</button>,
  ToastDescription: ({ children }: any) => <div data-testid="toast-description">{children}</div>,
  ToastProvider: ({ children }: any) => <div data-testid="toast-provider">{children}</div>,
  ToastTitle: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
}))

describe('useToast Hook', () => {
  beforeEach(() => {
    // Reset toast state before each test
    reset();
    vi.clearAllMocks();
    vi.useRealTimers(); // Ensure real timers are used by default
  });

  it('returns toast function and state', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.toast).toBeDefined()
    expect(typeof result.current.toast).toBe('function')
    expect(result.current.toasts).toBeDefined()
    expect(Array.isArray(result.current.toasts)).toBe(true)
  })

  it('creates a basic toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Title',
        description: 'Test Description'
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    const toast = result.current.toasts[0]
    expect(toast.title).toBe('Test Title')
    expect(toast.description).toBe('Test Description')
    expect(toast.id).toBeDefined()
    expect(toast.variant).toBe('default')
  })

  it('creates different toast types', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }: any) => <div>{children}</div>
    })

    act(() => {
      result.current.toast({
        title: 'Default Toast'
      })
    })

    act(() => {
      result.current.toast({
        title: 'Destructive Toast',
        variant: 'destructive'
      })
    })

    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0].variant).toBe('destructive')
    expect(result.current.toasts[1].variant).toBe('default')
  })

  it('handles toast with action', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ({ children }: any) => <div>{children}</div>
    })

    act(() => {
      result.current.toast({
        title: 'Action Toast',
        action: <button onClick={() => {}}>Undo</button>
      })
    })

    const toast = result.current.toasts[0]
    expect(toast.action).toBeDefined()
    expect(toast.title).toBe('Action Toast')
  })

  it('dismisses toast', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast())

    let toastId: string | undefined;
    act(() => {
      const { id } = result.current.toast({
        title: 'Test Toast'
      });
      toastId = id;
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      result.current.dismiss(toastId)
    })

    // The toast is marked for dismissal, but not removed yet
    expect(result.current.toasts[0].open).toBe(false);

    act(() => {
        vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0)
    vi.useRealTimers();
  })

  it('dismisses all toasts', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })

    expect(result.current.toasts).toHaveLength(3)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.toasts.every(t => t.open === false)).toBe(true);

    act(() => {
        vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0)
    vi.useRealTimers();
  })

  it('auto-dismisses toast after duration', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Auto-dismiss Toast',
        duration: 3000,
      });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // After duration, the toast is marked for dismissal
    expect(result.current.toasts[0].open).toBe(false);

    act(() => {
      // Advance timers to cover the removal delay
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.toasts).toHaveLength(0);
    vi.useRealTimers();
  });

  it('handles multiple toasts with different durations', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Short Toast',
        duration: 2000
      })
      result.current.toast({
        title: 'Long Toast',
        duration: 5000
      })
    })

    expect(result.current.toasts).toHaveLength(2)

    act(() => {
      vi.advanceTimersByTime(2000) // Dismiss the short toast
    })

    // The short toast is marked for dismissal, but not yet removed
    expect(result.current.toasts.find(t => t.title === 'Short Toast')?.open).toBe(false);
    expect(result.current.toasts.length).toBe(2);

    act(() => {
      vi.advanceTimersByTime(5000) // Wait for TOAST_REMOVE_DELAY
    });

    // Now the short toast should be removed
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Long Toast')

    act(() => {
      vi.advanceTimersByTime(3000) // Dismiss the long toast
    })

    act(() => {
      vi.advanceTimersByTime(5000) // Wait for TOAST_REMOVE_DELAY
    });

    expect(result.current.toasts).toHaveLength(0)

    vi.useRealTimers()
  })

  it('respects the toast limit', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.toast({ title: `Toast ${i + 1}` })
      }
    })

    expect(result.current.toasts).toHaveLength(5)
    expect(result.current.toasts[0].title).toBe('Toast 7')
    expect(result.current.toasts[4].title).toBe('Toast 3')
  })

  it('updates a toast', () => {
    const { result } = renderHook(() => useToast())

    let toastInstance: { id: string; dismiss: () => void; update: (props: any) => void; };
    act(() => {
      toastInstance = result.current.toast({ title: 'Initial Title' })
    })

    expect(result.current.toasts[0].title).toBe('Initial Title')

    act(() => {
      toastInstance.update({ title: 'Updated Title' })
    })

    expect(result.current.toasts[0].title).toBe('Updated Title')
  })


})
