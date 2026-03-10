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

export function GlobeIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function BuildingIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
      <path d="M8 6h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 6h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
    </svg>
  );
}

export function DocumentIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
      <path d="M10 9H8" />
    </svg>
  );
}

export function ListIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "shrink-0 text-zinc-400", size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MetricIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-4" />
    </svg>
  );
}

export function CalendarIcon({ className = "", size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export function ChartBarIcon({ className = "", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

export function ChartLineIcon({ className = "", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <polyline points="22 12 18 22 12 18 2 22" />
      <polyline points="22 2 12 12 2 8" />
    </svg>
  );
}

export function ExportIcon({ className = "", size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function LinkIcon({ className = "text-zinc-600", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
