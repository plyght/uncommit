"use client";

import { Slider } from "@base-ui/react/slider";
import { PRICING_TIERS } from "@/lib/pricing";

interface PricingSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

const TIER_VALUES = PRICING_TIERS.map((t) => t.versions);

export function PricingSlider({ value, onValueChange, disabled }: PricingSliderProps) {
  const currentTier = PRICING_TIERS.find((t) => t.versions === value) ?? PRICING_TIERS[0];

  const handleChange = (newValue: number | number[]) => {
    const val = Array.isArray(newValue) ? newValue[0] : newValue;
    const closestTier = TIER_VALUES.reduce((prev, curr) =>
      Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
    );
    onValueChange(closestTier);
  };

  return (
    <div className="flex flex-col gap-3">
      <Slider.Root
        value={value}
        onValueChange={handleChange}
        min={TIER_VALUES[0]}
        max={TIER_VALUES[TIER_VALUES.length - 1]}
        step={1}
        disabled={disabled}
      >
        <Slider.Control className="flex w-full touch-none items-center py-3 select-none">
          <Slider.Track className="h-1 w-full rounded-sm bg-[var(--gray-100)] shadow-[inset_0_0_0_1px] shadow-[var(--border)] select-none">
            <Slider.Indicator className="rounded-sm bg-[var(--accent)] select-none" />
            <Slider.Thumb
              aria-label="Versions per month"
              className="size-4 rounded-full bg-[var(--bg)] outline outline-2 outline-[var(--accent)] shadow-sm select-none transition-transform has-[:focus-visible]:scale-110 has-[:focus-visible]:outline-[3px] data-[disabled]:opacity-40"
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>

      <div className="flex items-center justify-between text-[0.625rem] opacity-60">
        {PRICING_TIERS.map((tier) => (
          <button
            key={tier.versions}
            type="button"
            onClick={() => !disabled && onValueChange(tier.versions)}
            disabled={disabled}
            className={`cursor-pointer transition-opacity hover:opacity-100 disabled:cursor-not-allowed ${
              value === tier.versions ? "opacity-100 font-medium" : "opacity-50"
            }`}
          >
            {tier.versions}
          </button>
        ))}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-[0.6875rem] opacity-70">
          <span className="font-medium text-[var(--accent)]">{currentTier.kofiTier}</span> tier
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[0.875rem] font-medium text-[var(--accent)]">${currentTier.price}</span>
          <span className="text-[0.625rem] opacity-60">/mo</span>
        </div>
      </div>
    </div>
  );
}
