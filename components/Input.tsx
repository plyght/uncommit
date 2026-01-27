import { InputHTMLAttributes, ChangeEvent } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`input${className ? ` ${className}` : ''}`}
      {...props}
    />
  );
}
