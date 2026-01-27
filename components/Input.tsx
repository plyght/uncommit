import { InputHTMLAttributes, ChangeEvent } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[0.75rem] text-[var(--fg)] outline-none transition-colors hover:border-[var(--fg)] focus:border-[var(--accent)]${className ? ` ${className}` : ""}`}
      {...props}
    />
  );
}
