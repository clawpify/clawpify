import { ChartBarIcon } from "./app-icons";

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

export function InboxIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

/** Product catalog / inventory (boxed items). */
export function PackageIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

export function SettingsIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function PlusIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

export function XMarkIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function PaperclipIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.6 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

/** Photo / gallery attach (landscape frame + sun + mountains). */
export function ImageIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

export function FilterIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

export function SortIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="m3 8 4-4 4 4M7 4v16M21 16l-4 4-4-4M17 20V4" />
    </svg>
  );
}

export function LayoutIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function BellIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FolderIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function MoreIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

export function PersonIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function ImportIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function InviteIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

export function LinkIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function BugIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="m8 2 1.88 1.88" />
      <path d="M14.12 3.88 16 2" />
      <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
      <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
      <path d="M12 20v-9" />
      <path d="M6 13h12" />
    </svg>
  );
}

export function LayoutRowsIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function LayoutGridIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

/** Stacked layers (saved view / layout). */
export function LayersIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .6.92l8.57 3.9a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .6.92l8.57 3.9a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </svg>
  );
}

export function FilterLinesIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <path d="M10 5h10M4 9h16M7 13h13M11 17h9" />
    </svg>
  );
}

export function SlidersHorizontalIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="17" x2="16" y2="17" />
      <circle cx="9" cy="7" r="2" />
      <circle cx="15" cy="17" r="2" />
    </svg>
  );
}

/** Sidebar / split panel toggle. */
export function PanelRightIcon({ className = "shrink-0 text-zinc-500", size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} {...iconProps} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}
