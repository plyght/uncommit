import { InputHTMLAttributes, ChangeEvent } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ style, ...props }: InputProps) {
  return (
    <input
      style={{
        ...styles.input,
        ...style,
      }}
      {...props}
    />
  );
}

const styles = {
  input: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: 'var(--fg)',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ':focus': {
      borderColor: 'var(--fg)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  } as React.CSSProperties,
};
