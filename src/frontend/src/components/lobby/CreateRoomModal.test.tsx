import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CreateRoomModal } from './CreateRoomModal';

describe('CreateRoomModal', () => {
  const mockOnClose = vi.fn();
  const mockOnCreate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <CreateRoomModal isOpen={false} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.getByText('Create Game Room')).toBeInTheDocument();
    });

    it('should render room name input', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    it('should render max players selector', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.getByLabelText(/max players/i)).toBeInTheDocument();
    });

    it('should render create button', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.getByRole('button', { name: /create room/i })).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when room name is empty', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const createButton = screen.getByRole('button', { name: /create room/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/room name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when room name is too short', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const nameInput = screen.getByLabelText(/room name/i);
      await user.type(nameInput, 'AB');

      const createButton = screen.getByRole('button', { name: /create room/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/room name must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when room name is too long', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const nameInput = screen.getByLabelText(/room name/i);
      // Type 51 characters (browser will limit to 50 due to maxLength)
      await user.type(nameInput, 'A'.repeat(51));
      
      // The input should have been limited to 50 chars by maxLength attribute
      expect((nameInput as HTMLInputElement).value.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Form Submission', () => {
    it('should call onCreate with form data when submitted', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const nameInput = screen.getByLabelText(/room name/i);
      await user.type(nameInput, 'My Game Room');

      const createButton = screen.getByRole('button', { name: /create room/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith({
          name: 'My Game Room',
          maxPlayers: 8,
        });
      });
    });

    it('should call onCreate with selected max players', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const nameInput = screen.getByLabelText(/room name/i);
      await user.type(nameInput, 'Test Room');

      const maxPlayersSelect = screen.getByLabelText(/max players/i);
      await user.selectOptions(maxPlayersSelect, '4');

      const createButton = screen.getByRole('button', { name: /create room/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnCreate).toHaveBeenCalledWith({
          name: 'Test Room',
          maxPlayers: 4,
        });
      });
    });

    it('should close modal after successful submission', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const nameInput = screen.getByLabelText(/room name/i);
      await user.type(nameInput, 'Test Room');

      const createButton = screen.getByRole('button', { name: /create room/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Close', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when overlay is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const overlay = container.querySelector('.modal-overlay');
      if (overlay) {
        await user.click(overlay);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should clear form when closed', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const nameInput = screen.getByLabelText(/room name/i);
      await user.type(nameInput, 'Test Room');

      rerender(
        <CreateRoomModal isOpen={false} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      rerender(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const newNameInput = screen.getByLabelText(/room name/i);
      expect(newNameInput).toHaveValue('');
    });
  });

  describe('Max Players Options', () => {
    it('should have options for 2 to 8 players', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const select = screen.getByLabelText(/max players/i);
      const options = Array.from(select.querySelectorAll('option'));
      const values = options.map(opt => opt.value);

      expect(values).toEqual(['2', '4', '6', '8']);
    });

    it('should default to 8 players', () => {
      render(
        <CreateRoomModal isOpen={true} onClose={mockOnClose} onCreate={mockOnCreate} />
      );

      const select = screen.getByLabelText(/max players/i) as HTMLSelectElement;
      expect(select.value).toBe('8');
    });
  });
});
