import React, { useState, useEffect } from 'react';
import { Button } from '@/components/common';
import './CreateRoomModal.css';

interface CreateRoomData {
  name: string;
  maxPlayers: number;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateRoomData) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setRoomName('');
      setMaxPlayers(8);
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!roomName.trim()) {
      newErrors.name = 'Room name is required';
    } else if (roomName.trim().length < 3) {
      newErrors.name = 'Room name must be at least 3 characters';
    } else if (roomName.trim().length > 50) {
      newErrors.name = 'Room name must be at most 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onCreate({
        name: roomName.trim(),
        maxPlayers,
      });
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" role="dialog" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Create Game Room</h2>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label htmlFor="room-name">
              Room Name <span className="required">*</span>
            </label>
            <input
              id="room-name"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className={errors.name ? 'input-error' : ''}
              maxLength={50}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="max-players">Max Players</label>
            <select
              id="max-players"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              <option value={2}>2 Players</option>
              <option value={4}>4 Players</option>
              <option value={6}>6 Players</option>
              <option value={8}>8 Players</option>
            </select>
          </div>

          <div className="modal-footer">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
