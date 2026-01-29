"use client";

import { Select as BaseSelect } from "@base-ui/react/select";

interface SelectItem {
  value: string;
  label: string;
}

interface SelectProps {
  items: SelectItem[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function handleValueChange(
  onValueChange: (value: string) => void
): (value: string | null) => void {
  return (value) => {
    if (value !== null) {
      onValueChange(value);
    }
  };
}

export function Select({ items, value, onValueChange, placeholder = "Select...", disabled }: SelectProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={handleValueChange(onValueChange)}
      disabled={disabled}
    >
      <BaseSelect.Trigger className="flex h-10 w-full cursor-pointer select-none items-center justify-between gap-2 border border-[var(--border)] bg-[var(--input-bg)] px-3 text-[0.75rem] text-[var(--fg)] outline-none transition-[border-color] duration-150 hover:border-[var(--fg)] focus-visible:border-[var(--accent)] data-[disabled]:cursor-not-allowed data-[popup-open]:border-[var(--fg)] data-[disabled]:opacity-40 data-[disabled]:hover:border-[var(--border)] sm:h-9">
        <BaseSelect.Value className="min-w-0 flex-1 truncate text-left data-[placeholder]:opacity-50" placeholder={placeholder} />
        <BaseSelect.Icon className="flex shrink-0 opacity-50">
          <ChevronIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="z-50 outline-none" sideOffset={8}>
          <BaseSelect.Popup className="min-w-[var(--anchor-width)] w-max max-w-[90vw] max-h-[300px] overflow-y-auto origin-[var(--transform-origin)] border border-[var(--border)] bg-[var(--input-bg)] text-[var(--fg)] shadow-md transition-[transform,opacity] duration-150 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
            <BaseSelect.List>
              {items.map((item) => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className="grid cursor-pointer select-none grid-cols-[0.75rem_1fr] items-center gap-[0.375rem] px-[0.625rem] py-[0.5rem] text-[0.75rem] outline-none data-[highlighted]:bg-[var(--gray-100)] data-[selected]:font-medium data-[selected]:text-[var(--accent)]"
                >
                  <BaseSelect.ItemIndicator className="flex items-center justify-center">
                    <CheckIcon />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="whitespace-nowrap">
                    {item.label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg fill="currentColor" width="10" height="10" viewBox="0 0 10 10">
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
