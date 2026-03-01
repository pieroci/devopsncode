import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { userEvent } from '@testing-library/user-event';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with children text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('should apply default button class', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn');
    });
  });

  describe('Variants', () => {
    it('should render primary variant', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-secondary');
    });

    it('should render danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-danger');
    });

    it('should default to primary variant', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-primary');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Button size="small">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-small');
    });

    it('should render medium size', () => {
      render(<Button size="medium">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });

    it('should render large size', () => {
      render(<Button size="large">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-large');
    });

    it('should default to medium size', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-medium');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading text when provided', () => {
      render(<Button loading loadingText="Please wait">Loading</Button>);
      expect(screen.getByText('Please wait')).toBeInTheDocument();
    });

    it('should apply loading class', () => {
      render(<Button loading>Loading</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-loading');
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('btn-full-width');
    });
  });

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button loading onClick={handleClick}>Loading</Button>);
      
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Button Type', () => {
    it('should default to button type', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });

    it('should accept submit type', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should accept reset type', () => {
      render(<Button type="reset">Reset</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'reset');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close">X</Button>);
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });
  });
});
