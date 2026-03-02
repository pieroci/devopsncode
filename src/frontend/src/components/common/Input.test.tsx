import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from './Input';
import { userEvent } from '@testing-library/user-event';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input element', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter your email" />);
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Input className="custom-input" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-input');
    });
  });

  describe('Input Types', () => {
    it('should default to text type', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    it('should accept email type', () => {
      render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });

    it('should accept password type', () => {
      const { container } = render(<Input type="password" />);
      const input = container.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should accept number type', () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should be required when required prop is true', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('should be readonly when readonly prop is true', () => {
      render(<Input readOnly value="readonly text" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('Error Handling', () => {
    it('should display error message', () => {
      render(<Input error="Invalid email" />);
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should apply error class when error exists', () => {
      render(<Input error="Error message" />);
      expect(screen.getByRole('textbox')).toHaveClass('input-error');
    });

    it('should not show error when no error prop', () => {
      render(<Input />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Helper Text', () => {
    it('should display helper text', () => {
      render(<Input helperText="Enter a valid email address" />);
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    });

    it('should show helper text when no error', () => {
      render(<Input helperText="Helper" error="" />);
      expect(screen.getByText('Helper')).toBeInTheDocument();
    });

    it('should prioritize error over helper text', () => {
      render(<Input helperText="Helper" error="Error" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });
  });

  describe('Value Control', () => {
    it('should accept controlled value', () => {
      render(<Input value="test value" onChange={() => {}} />);
      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });

    it('should accept default value', () => {
      render(<Input defaultValue="default text" />);
      expect(screen.getByRole('textbox')).toHaveValue('default text');
    });
  });

  describe('Interactions', () => {
    it('should call onChange when typing', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<Input onChange={handleChange} />);
      
      await user.type(screen.getByRole('textbox'), 'test');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onBlur when losing focus', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      
      render(<Input onBlur={handleBlur} />);
      
      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();
      
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus when gaining focus', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      
      render(<Input onFocus={handleFocus} />);
      
      await user.click(screen.getByRole('textbox'));
      
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth is true', () => {
      render(<Input fullWidth />);
      expect(screen.getByRole('textbox').parentElement).toHaveClass('input-full-width');
    });
  });

  describe('ID and Name', () => {
    it('should accept id prop', () => {
      render(<Input id="email-input" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-input');
    });

    it('should accept name prop', () => {
      render(<Input name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('name', 'email');
    });

    it('should link label to input via id', () => {
      render(<Input id="test-input" label="Test Label" />);
      const input = screen.getByLabelText('Test Label');
      expect(input).toHaveAttribute('id', 'test-input');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible label', () => {
      render(<Input label="Username" />);
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
    });

    it('should associate error with input via aria-describedby', () => {
      render(<Input id="email" error="Invalid email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should mark required fields', () => {
      render(<Input label="Email" required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });
  });
});
