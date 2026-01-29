import { InputHTMLAttributes, ChangeEvent } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`h-10 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[0.75rem] text-[var(--fg)] outline-none transition-[border-color] duration-150 placeholder:text-[var(--fg)] placeholder:opacity-40 hover:enabled:border-[var(--fg)] focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40 sm:h-9${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
