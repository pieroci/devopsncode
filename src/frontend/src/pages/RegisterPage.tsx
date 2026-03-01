import React, { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const { isLoading, error, setAuth, setLoading, setError } = useAuthStore();
  const navigate = useNavigate();

  const validateUsername = (value: string): boolean => {
    if (!value) {
      setUsernameError('Username is required');
      return false;
    }
    if (value.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value: string): boolean => {
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    value: string
  ) => {
    setter(value);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const isUsernameValid = validateUsername(username);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);
    
    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.register({
        username,
        email,
        password,
      });
      
      setAuth(response);
      
      // Navigate to home page after successful registration
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <h1>Sign Up</h1>
        
        {error && (
          <div className="register-error" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <Input
            type="text"
            label="Username"
            value={username}
            onChange={(e) => handleInputChange(setUsername, e.target.value)}
            onBlur={() => validateUsername(username)}
            error={usernameError}
            disabled={isLoading}
            fullWidth
            required
          />
          
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => handleInputChange(setEmail, e.target.value)}
            onBlur={() => validateEmail(email)}
            error={emailError}
            disabled={isLoading}
            fullWidth
            required
          />
          
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => {
              handleInputChange(setPassword, e.target.value);
              // Re-validate confirm password if it has a value
              if (confirmPassword) {
                validateConfirmPassword(confirmPassword);
              }
            }}
            onBlur={() => validatePassword(password)}
            error={passwordError}
            disabled={isLoading}
            fullWidth
            required
          />
          
          <Input
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => handleInputChange(setConfirmPassword, e.target.value)}
            onBlur={() => validateConfirmPassword(confirmPassword)}
            error={confirmPasswordError}
            disabled={isLoading}
            fullWidth
            required
          />
          
          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            loadingText="Signing up..."
          >
            Sign Up
          </Button>
        </form>
        
        <div className="register-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
