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
      <BaseSelect.Trigger className="select-trigger">
        <BaseSelect.Value className="select-value" placeholder={placeholder} />
        <BaseSelect.Icon className="select-icon">
          <ChevronIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="select-positioner" sideOffset={8}>
          <BaseSelect.Popup className="select-popup">
            <BaseSelect.List className="select-list">
              {items.map((item) => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className="select-item"
                >
                  <BaseSelect.ItemIndicator className="select-item-indicator">
                    <CheckIcon />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="select-item-text">
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
