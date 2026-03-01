import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = `${inputId}-error`;
  const hasError = Boolean(error);

  const containerClasses = [
    'input-container',
    fullWidth && 'input-full-width',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'input',
    hasError && 'input-error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {props.required && <span className="input-required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        className={inputClasses}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      
      {(error || helperText) && (
        <div
          id={errorId}
          className={hasError ? 'input-error-text' : 'input-helper-text'}
          role={hasError ? 'alert' : undefined}
        >
          {error || helperText}
        </div>
      )}
    </div>
  );
};
