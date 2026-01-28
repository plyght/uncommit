import { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ width, height, className = "", style, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--gray-200)] ${className}`}
      style={{
        width,
        height,
        borderRadius: "var(--radius)",
        ...style,
      }}
      {...props}
    />
  );
}
