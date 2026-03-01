import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api/authApi';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { isLoading, error, setAuth, setLoading, setError } = useAuthStore();
  const navigate = useNavigate();

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
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError(null);
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError(null);
    if (passwordError) {
      validatePassword(e.target.value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login({ email, password });
      setAuth(response);
      
      // Navigate to home page after successful login
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Login</h1>
        
        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={handleEmailChange}
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
            onChange={handlePasswordChange}
            onBlur={() => validatePassword(password)}
            error={passwordError}
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
            loadingText="Logging in..."
          >
            Log In
          </Button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
