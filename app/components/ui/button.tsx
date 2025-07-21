import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'green' | 'danger' | 'gray';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  noFlex?: boolean; // Disable the default flex-grow behavior
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({ 
  variant = 'primary', 
  children, 
  onClick, 
  disabled = false,
  className = 'w-full',
  noFlex = false,
  type = 'button'
}: ButtonProps) {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    green: 'btn-green',
    danger: 'btn-danger',
    gray: 'btn-gray'
  };

  // Use gray variant when disabled for visual feedback
  const effectiveVariant = disabled ? 'gray' : variant;
  const flexClass = noFlex ? '' : 'flex-grow';

  return (
    <button 
      type={type}
      className={`${baseClasses} ${variantClasses[effectiveVariant]} ${flexClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
