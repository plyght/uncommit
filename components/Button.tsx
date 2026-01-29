import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export function Button({ children, fullWidth, className, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center border border-transparent bg-[var(--button-bg)] px-5 text-[0.75rem] font-medium text-[var(--button-fg)] transition-colors duration-150 hover:enabled:bg-[var(--button-hover)] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:px-4${fullWidth ? " w-full" : ""}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
