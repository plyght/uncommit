import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export function Button({ children, fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center rounded-[var(--radius)] border border-transparent bg-[var(--button-bg)] px-4 text-[0.75rem] font-medium text-[var(--button-fg)] transition-colors duration-150 hover:enabled:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-40${fullWidth ? " w-full" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
