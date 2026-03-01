'use client'

export default function PpiBadge({
  score,
  className,
}: {
  score?: number
  className?: string
}) {
  if (score == null) return null

  const tone =
    score >= 85
      ? 'bg-emerald-50 text-emerald-700'
      : score >= 70
        ? 'bg-lime-50 text-lime-700'
        : 'bg-amber-50 text-amber-700'

  return (
    <span
      className={`${tone} ${className || ''} border border-black/5 text-[11px] px-2 py-1 rounded-full font-semibold`}
    >
      EcoScore {score}
    </span>
  )
}
