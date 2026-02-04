interface RadioGroupItem {
  value: string;
  label: string;
}

interface RadioGroupProps {
  items: RadioGroupItem[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  name?: string;
  "aria-label"?: string;
}

export function RadioGroup({ items, value, onValueChange, disabled, name, "aria-label": ariaLabel }: RadioGroupProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1" role="radiogroup" aria-label={ariaLabel}>
      {items.map((item) => (
        <label
          key={item.value}
          className={`flex min-h-[44px] cursor-pointer items-center gap-2 py-1 text-[0.75rem] ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          }`}
        >
          <div
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
              value === item.value
                ? "border-[var(--accent)]"
                : "border-[var(--border)] hover:border-[var(--fg)]"
            }`}
          >
            {value === item.value && (
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <input
            type="radio"
            className="sr-only focus-visible:outline-none"
            name={name}
            value={item.value}
            checked={value === item.value}
            onChange={() => onValueChange(item.value)}
            disabled={disabled}
            aria-label={item.label}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}
