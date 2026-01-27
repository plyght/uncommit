import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export function Button({ children, fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={`btn${fullWidth ? ' btn--full' : ''}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
