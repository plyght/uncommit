import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export function Button({ children, fullWidth, style, ...props }: ButtonProps) {
  return (
    <button
      style={{
        ...styles.button,
        ...(fullWidth && styles.fullWidth),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

const styles = {
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--button-fg)',
    backgroundColor: 'var(--button-bg)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: 'var(--button-hover)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  } as React.CSSProperties,
  fullWidth: {
    width: '100%',
  },
};
