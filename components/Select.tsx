import { SelectHTMLAttributes, ChangeEvent } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
}

export function Select({ style, children, ...props }: SelectProps) {
  return (
    <select
      style={{
        ...styles.select,
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

const styles = {
  select: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: 'var(--fg)',
    backgroundColor: 'var(--input-bg)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    outline: 'none',
    cursor: 'pointer',
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
