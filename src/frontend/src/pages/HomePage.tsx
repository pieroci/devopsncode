import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handlePlayGame = () => {
    navigate('/lobby');
  };

  const handleViewProfile = () => {
    // TODO: Navigate to profile page when implemented
    console.log('Navigate to profile page');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Header Section */}
        <header className="home-header">
          <h1>Dashboard</h1>
          <div className="user-info">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <h2>Welcome back, {user?.username || 'User'}!</h2>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
        </header>

        {/* Quick Actions Section */}
        <section className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <Button
              variant="primary"
              size="large"
              onClick={handlePlayGame}
              className="action-button"
            >
              🎮 Play Game
            </Button>
            <Button
              variant="secondary"
              size="large"
              onClick={handleViewProfile}
              className="action-button"
            >
              👤 View Profile
            </Button>
            <Button
              variant="danger"
              size="large"
              onClick={handleLogout}
              className="action-button"
            >
              🚪 Logout
            </Button>
          </div>
        </section>

        {/* Game Statistics Section */}
        <section className="stats-section">
          <h3>Game Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <p className="stat-label">Total Games</p>
                <p className="stat-value">-</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <p className="stat-label">Wins</p>
                <p className="stat-value">-</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <p className="stat-label">ELO Rating</p>
                <p className="stat-value">-</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <p className="stat-label">Win Rate</p>
                <p className="stat-value">-</p>
              </div>
            </div>
          </div>
          <p className="stats-placeholder">
            Game statistics will be available once you start playing!
          </p>
        </section>

        {/* Recent Activity Section */}
        <section className="activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-placeholder">
            <p>No recent activity yet. Start playing to see your game history!</p>
          </div>
        </section>
      </div>
    </div>
  );
};
