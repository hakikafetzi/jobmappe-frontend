// Icon-Set der App (Strichzeichnungen). Dekorativ: aria-hidden.
import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = (viewBox: string, strokeWidth: number) => ({
  viewBox,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
})

export const SearchIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2)} {...p}>
    <circle cx="8.5" cy="8.5" r="5.5" />
    <path d="M13 13l4 4" />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2.2)} {...p}>
    <path d="M10 4v12M4 10h12" />
  </svg>
)

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2)} {...p}>
    <path d="M6 8l4 4 4-4" />
  </svg>
)

export const PenIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M4 16l1-4 8-8 3 3-8 8-4 1z" />
  </svg>
)

/** Häkchen im Kreis (z. B. „Bewerbung abschließen“) */
export const CheckCircleIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <circle cx="10" cy="10" r="7.2" />
    <path d="M7 10.2l2.1 2.1 4-4.4" />
  </svg>
)

/** Pfeil zurück im Bogen (Wieder öffnen) */
export const UndoIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M7.5 3.5L4 7l3.5 3.5" />
    <path d="M4 7h7.5a4.5 4.5 0 010 9H9" />
  </svg>
)

/** Bürogebäude (Firmen) */
export const BuildingIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M4 17V4.5c0-.8.7-1.5 1.5-1.5h6c.8 0 1.5.7 1.5 1.5V17M13 8h2.5c.8 0 1.5.7 1.5 1.5V17M2.5 17h15" />
    <path d="M7 6.5h3M7 9.5h3M7 12.5h3" />
  </svg>
)

/** Pfeil nach rechts (zu einer anderen Seite der App) */
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.8)} {...p}>
    <path d="M4 10h12M11 5l5 5-5 5" />
  </svg>
)

/** Pfeil aus einem Kasten (öffnet eine externe Seite) */
export const ExternalLinkIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M11 3.5h5.5V9M16.5 3.5 9.5 10.5" />
    <path d="M14 11.5v3.5c0 .8-.7 1.5-1.5 1.5H5c-.8 0-1.5-.7-1.5-1.5V7.5C3.5 6.7 4.2 6 5 6h3.5" />
  </svg>
)

/** Archivkiste */
export const ArchiveIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <rect x="3" y="3.8" width="14" height="4" rx="1" />
    <path d="M4.5 7.8v7c0 .8.7 1.4 1.5 1.4h8c.8 0 1.5-.6 1.5-1.4v-7M8.3 11h3.4" />
  </svg>
)

export const InboxIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M3 11.5l2.2-6.1c.2-.6.8-.9 1.4-.9h6.8c.6 0 1.2.3 1.4.9l2.2 6.1" />
    <path d="M3 11.5V15c0 .8.7 1.5 1.5 1.5h11c.8 0 1.5-.7 1.5-1.5v-3.5h-4l-1 2h-4l-1-2z" />
  </svg>
)

export const BoardIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <rect x="3" y="4" width="4" height="12" rx="1.2" />
    <rect x="8.5" y="4" width="4" height="8" rx="1.2" />
    <rect x="14" y="4" width="3" height="10" rx="1.2" />
  </svg>
)

export const TableIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.6)} {...p}>
    <rect x="3" y="4" width="14" height="12" rx="1.6" />
    <path d="M3 8.5h14M3 12.5h14M8 4v12" />
  </svg>
)

export const FolderIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.6)} {...p}>
    <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h3.2l1.6 1.8h6.2A1.5 1.5 0 0 1 17 8.3v6.2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base('0 0 24 24', 1.8)} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

/* ---- Navigation (16er-Raster) ---- */

export const HomeIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <path d="M2.4 6.6 8 2.3l5.6 4.3V13a.7.7 0 0 1-.7.7H3.1a.7.7 0 0 1-.7-.7Z" />
    <path d="M6.3 13.7V9h3.4v4.7" />
  </svg>
)

export const BriefcaseIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <rect x="2" y="4.9" width="12" height="8.4" rx="1.3" />
    <path d="M6 4.9V3.6c0-.5.4-.9.9-.9h2.2c.5 0 .9.4.9.9v1.3" />
    <path d="M2 8.4h12" />
  </svg>
)

export const ColumnsIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <rect x="2.2" y="2.7" width="3.4" height="10.6" rx="1" />
    <rect x="6.9" y="2.7" width="3.4" height="7" rx="1" />
    <rect x="11.6" y="2.7" width="2.2" height="4.6" rx="1" />
  </svg>
)

export const UserIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <circle cx="8" cy="5.6" r="2.6" />
    <path d="M3 13.4c0-2.3 2.2-3.6 5-3.6s5 1.3 5 3.6" />
  </svg>
)

export const GridIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <rect x="2.5" y="2.5" width="4.7" height="4.7" rx="1" />
    <rect x="8.8" y="2.5" width="4.7" height="4.7" rx="1" />
    <rect x="2.5" y="8.8" width="4.7" height="4.7" rx="1" />
    <rect x="8.8" y="8.8" width="4.7" height="4.7" rx="1" />
  </svg>
)

export const GearIcon = (p: IconProps) => (
  <svg {...base('0 0 24 24', 2)} {...p}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <path d="M1.6 8s2.4-4.4 6.4-4.4S14.4 8 14.4 8 12 12.4 8 12.4 1.6 8 1.6 8Z" />
    <circle cx="8" cy="8" r="1.9" />
  </svg>
)

export const EyeOffIcon = (p: IconProps) => (
  <svg {...base('0 0 16 16', 1.5)} {...p}>
    <path d="M6.6 3.8A6 6 0 0 1 8 3.6c4 0 6.4 4.4 6.4 4.4a11 11 0 0 1-1.7 2.2M4.3 4.9C2.6 6.1 1.6 8 1.6 8s2.4 4.4 6.4 4.4c1.3 0 2.5-.5 3.4-1.1" />
    <path d="M6.7 6.7a1.9 1.9 0 0 0 2.6 2.6M2 2l12 12" />
  </svg>
)

/** Seitenleiste ein-/ausblenden */
export const PanelIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <rect x="3" y="4" width="14" height="12" rx="2" />
    <path d="M12.5 4v12" />
  </svg>
)

export const AlertIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.8)} {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 6.2v4.6M10 13.8h.01" />
  </svg>
)

export const InfoIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.8)} {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M10 9.2v4.6M10 6.2h.01" />
  </svg>
)

export const NoteIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M5.5 2.8h6.2L15.5 6.6v9.1c0 .8-.7 1.5-1.5 1.5H5.5c-.8 0-1.5-.7-1.5-1.5V4.3c0-.8.7-1.5 1.5-1.5Z" />
    <path d="M11.5 2.8v4h4M7 10.5h6M7 13.5h4" />
  </svg>
)

export const CalendarIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
    <path d="M3 8.5h14M7 2.5v3.5M13 2.5v3.5" />
  </svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2)} {...p}>
    <path d="M12 5l-5 5 5 5" />
  </svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2)} {...p}>
    <path d="M8 5l5 5-5 5" />
  </svg>
)

/** Vollbild öffnen */
export const ExpandIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.8)} {...p}>
    <path d="M12 3.5h4.5V8M8 16.5H3.5V12M16.5 3.5l-5 5M3.5 16.5l5-5" />
  </svg>
)

/** Vollbild beenden */
export const CollapseIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.8)} {...p}>
    <path d="M16.5 8H12V3.5M3.5 12H8v4.5M12 8l4.5-4.5M8 12l-4.5 4.5" />
  </svg>
)

/** Größe und Lage zurücksetzen */
export const ResetSizeIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.8)} {...p}>
    <path d="M4.5 9.5a5.5 5.5 0 1 1 1.7 4" />
    <path d="M4 5.5v4h4" />
  </svg>
)

/** Daneben öffnen: Fenster mit geteilter Ansicht, Plus in der rechten Hälfte */
export const SplitViewIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.6)} {...p}>
    <rect x="2.5" y="4" width="15" height="12" rx="2" />
    <path d="M10 4v12M13.75 8.2v3.6M11.95 10h3.6" />
  </svg>
)

/** Minimieren: Strich unten */
export const MinimizeIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2)} {...p}>
    <path d="M5 14.5h10" />
  </svg>
)

export const TrashIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 1.7)} {...p}>
    <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5" />
    <path d="M5 5.5l.8 10.1a1.5 1.5 0 0 0 1.5 1.4h5.4a1.5 1.5 0 0 0 1.5-1.4L15 5.5M8.3 9v4.5M11.7 9v4.5" />
  </svg>
)

export const CloseIcon = (p: IconProps) => (
  <svg {...base('0 0 20 20', 2)} {...p}>
    <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
  </svg>
)
