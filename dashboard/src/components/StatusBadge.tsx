const STATUS_CONFIG: Record<string, { bg: string; label: string }> = {
  EMPTY:    { bg: 'bg-green-500',  label: 'VACÍO' },
  HALF:     { bg: 'bg-yellow-400', label: 'MEDIO' },
  FULL:     { bg: 'bg-red-500',    label: 'LLENO' },
  OVERFLOW: { bg: 'bg-red-600 animate-pulse', label: 'DESBORDADO ⚠' },
}

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-block px-2 py-1 rounded text-xs font-semibold text-white bg-gray-400">
        —
      </span>
    )
  }
  const cfg = STATUS_CONFIG[status] ?? { bg: 'bg-gray-400', label: status }
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${cfg.bg}`}>
      {cfg.label}
    </span>
  )
}
