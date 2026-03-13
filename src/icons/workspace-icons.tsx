import { ChartBarIcon } from "./audit-icons";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

type IconProps = {
  className?: string;
  size?: number;
};

export function HomeIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h3a1 1 0 001-1V10" />
    </svg>
  );
}

export function UsersIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function StoreIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4" />
    </svg>
  );
}

export function SearchIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function EyeIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export { ChartBarIcon };
