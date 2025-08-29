import * as React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { Input } from '../../../components/ui/input'
import userEvent from '@testing-library/user-event'

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />)

    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" />)

    let input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    input = screen.getByDisplayValue('')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('handles value and onChange', async () => {
    const user = userEvent.setup();
    const ControlledInput = () => {
      const [value, setValue] = React.useState('test');
      return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
    };

    render(<ControlledInput />);

    const input = screen.getByDisplayValue('test');
    await user.type(input, 'ing');

    expect(input).toHaveValue('testing');
  });

  it('can be disabled', () => {
    render(<Input disabled />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('shows placeholder text', () => {
    render(<Input placeholder="Type here..." />)

    const input = screen.getByPlaceholderText('Type here...')
    expect(input).toBeInTheDocument()
  })

  it('forwards additional props', () => {
    render(<Input data-testid="custom-input" maxLength={50} />)

    const input = screen.getByTestId('custom-input')
    expect(input).toHaveAttribute('maxlength', '50')
  })
})
