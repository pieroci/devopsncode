import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { RoomCard } from './RoomCard';
import { GameSession } from '@/types';

const mockRoom: GameSession = {
  id: '1',
  worldId: 'world-1',
  hostPlayerId: 'host-123',
  status: 'waiting',
  maxPlayers: 8,
  currentPlayers: 3,
  players: [
    {
      playerId: 'host-123',
      username: 'HostPlayer',
      isReady: true,
      x: 0,
      y: 0,
      rotation: 0,
      speed: 0,
      lap: 0,
      position: 1,
    },
    {
      playerId: 'player-2',
      username: 'Player2',
      isReady: false,
      x: 0,
      y: 0,
      rotation: 0,
      speed: 0,
      lap: 0,
      position: 2,
    },
    {
      playerId: 'player-3',
      username: 'Player3',
      isReady: true,
      x: 0,
      y: 0,
      rotation: 0,
      speed: 0,
      lap: 0,
      position: 3,
    },
  ],
};

describe('RoomCard', () => {
  describe('Rendering', () => {
    it('should render room card', () => {
      render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);
      expect(screen.getByTestId('room-card')).toBeInTheDocument();
    });

    it('should display room name', () => {
      const roomWithName = { ...mockRoom, name: 'Epic Race Room' };
      render(<RoomCard room={roomWithName as any} onJoin={vi.fn()} />);
      expect(screen.getByText('Epic Race Room')).toBeInTheDocument();
    });

    it('should display player count', () => {
      render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);
      expect(screen.getByText('3/8 Players')).toBeInTheDocument();
    });

    it('should display host indicator', () => {
      render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);
      expect(screen.getByText(/host:/i)).toBeInTheDocument();
      expect(screen.getByText('HostPlayer')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show waiting status badge', () => {
      render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);
      expect(screen.getByText('Waiting')).toBeInTheDocument();
    });

    it('should show starting status badge', () => {
      const startingRoom = { ...mockRoom, status: 'starting' as const };
      render(<RoomCard room={startingRoom} onJoin={vi.fn()} />);
      expect(screen.getByText('Starting')).toBeInTheDocument();
    });

    it('should show active status badge', () => {
      const activeRoom = { ...mockRoom, status: 'active' as const };
      render(<RoomCard room={activeRoom} onJoin={vi.fn()} />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show finished status badge', () => {
      const finishedRoom = { ...mockRoom, status: 'finished' as const };
      const { container } = render(<RoomCard room={finishedRoom} onJoin={vi.fn()} />);
      const statusBadge = container.querySelector('.status-badge.status-finished');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('Finished');
    });
  });

  describe('Join Button', () => {
    it('should render join button for waiting rooms', () => {
      render(<RoomCard room={mockRoom} onJoin={vi.fn()} />);
      expect(screen.getByRole('button', { name: /join/i })).toBeInTheDocument();
    });

    it('should call onJoin when join button is clicked', async () => {
      const user = userEvent.setup();
      const onJoin = vi.fn();
      render(<RoomCard room={mockRoom} onJoin={onJoin} />);
      
      await user.click(screen.getByRole('button', { name: /join/i }));
      
      expect(onJoin).toHaveBeenCalledWith(mockRoom.id);
    });

    it('should disable join button when room is full', () => {
      const fullRoom = { ...mockRoom, currentPlayers: 8 };
      render(<RoomCard room={fullRoom} onJoin={vi.fn()} />);
      
      const joinButton = screen.getByRole('button', { name: /full/i });
      expect(joinButton).toBeDisabled();
    });

    it('should disable join button when room is starting', () => {
      const startingRoom = { ...mockRoom, status: 'starting' as const };
      render(<RoomCard room={startingRoom} onJoin={vi.fn()} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable join button when room is active', () => {
      const activeRoom = { ...mockRoom, status: 'active' as const };
      render(<RoomCard room={activeRoom} onJoin={vi.fn()} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable join button when room is finished', () => {
      const finishedRoom = { ...mockRoom, status: 'finished' as const };
      render(<RoomCard room={finishedRoom} onJoin={vi.fn()} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Room Full State', () => {
    it('should show "Full" button text when room is full', () => {
      const fullRoom = { ...mockRoom, currentPlayers: 8 };
      render(<RoomCard room={fullRoom} onJoin={vi.fn()} />);
      
      expect(screen.getByText('Full')).toBeInTheDocument();
    });

    it('should show full room indicator', () => {
      const fullRoom = { ...mockRoom, currentPlayers: 8 };
      render(<RoomCard room={fullRoom} onJoin={vi.fn()} />);
      
      expect(screen.getByText('8/8 Players')).toBeInTheDocument();
    });
  });
});
