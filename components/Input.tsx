import { InputHTMLAttributes, ChangeEvent, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1">
        <input
          ref={ref}
          className={`h-10 w-full border bg-[var(--input-bg)] px-3 text-[0.75rem] text-[var(--fg)] outline-none transition-[border-color] duration-150 placeholder:text-[var(--fg)] placeholder:opacity-40 hover:enabled:border-[var(--fg)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 ${
            error ? "border-[var(--error)]" : "border-[var(--border)]"
          }${className ? ` ${className}` : ""}`}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error && props.id ? `${props.id}-error` : undefined}
          {...props}
        />
        {error && (
          <span
            id={props.id ? `${props.id}-error` : undefined}
            className="text-[0.6875rem] text-[var(--error)]"
            role="alert"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
