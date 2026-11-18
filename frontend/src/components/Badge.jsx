const TONES = {
  neutral: 'bg-ocean-50 text-ocean-700 border-ocean-100',
  info: 'bg-ocean-100 text-ocean-700 border-ocean-300',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  dark: 'bg-ocean-700 text-white border-ocean-700',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.neutral} ${className}`}
    >
      {children}
    </span>
  )
}
