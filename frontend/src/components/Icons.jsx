/** Minimal inline SVG icon set — no external icon library. */

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

function makeIcon(paths) {
  return function Icon({ className = 'h-5 w-5' }) {
    return (
      <svg {...svgProps} className={className}>
        {paths}
      </svg>
    )
  }
}

export const SearchIcon = makeIcon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </>,
)

export const PlusIcon = makeIcon(
  <>
    <path d="M12 5v14M5 12h14" />
  </>,
)

export const PencilIcon = makeIcon(
  <>
    <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3Z" />
    <path d="m13.5 6.5 4 4" />
  </>,
)

export const TrashIcon = makeIcon(
  <>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </>,
)

export const ChevronLeftIcon = makeIcon(<path d="m15 18-6-6 6-6" />)
export const ChevronRightIcon = makeIcon(<path d="m9 18 6-6-6-6" />)
export const CloseIcon = makeIcon(<path d="M6 6l12 12M18 6 6 18" />)

export const MenuIcon = makeIcon(
  <>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </>,
)

export const ChatIcon = makeIcon(
  <>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
    <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
  </>,
)

export const SendIcon = makeIcon(
  <>
    <path d="m21 3-9 18-2.5-7.5L2 11l19-8Z" />
    <path d="m9.5 13.5 5-5" />
  </>,
)

export const ShieldIcon = makeIcon(
  <>
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
)

export const CheckIcon = makeIcon(<path d="m5 12 4 4L19 6" />)
export const AlertIcon = makeIcon(
  <>
    <path d="M12 9v4M12 17h.01" />
    <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
  </>,
)

export const InfoIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
)

export const CopyIcon = makeIcon(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </>,
)

export const DownloadIcon = makeIcon(
  <>
    <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 17v3h16v-3" />
  </>,
)

export const RefreshIcon = makeIcon(
  <>
    <path d="M20 7v5h-5" />
    <path d="M19 12a7 7 0 1 1-2-5l3 3" />
  </>,
)

export const EyeIcon = makeIcon(
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)

export const CalendarIcon = makeIcon(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
)

export const UserIcon = makeIcon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </>,
)

export const DocumentIcon = makeIcon(
  <>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </>,
)

export const LockIcon = makeIcon(
  <>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
)

export const KeyIcon = makeIcon(
  <>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9M17 6l2 2M14 9l2 2" />
  </>,
)

export const ChartIcon = makeIcon(
  <>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </>,
)

export const SlidersIcon = makeIcon(
  <>
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </>,
)

export const ExternalIcon = makeIcon(
  <>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </>,
)

export const HomeIcon = makeIcon(
  <>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10h14V10M9 20v-6h6v6" />
  </>,
)

export const TagIcon = makeIcon(
  <>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="7.5" cy="7.5" r="1.2" />
  </>,
)

export const ClockIcon = makeIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
)
