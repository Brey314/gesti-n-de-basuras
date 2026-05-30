const CHIP_CONFIG: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-800',
  USED:      'bg-gray-100 text-gray-600',
  SUSPENDED: 'bg-yellow-100 text-yellow-800',
  REVOKED:   'bg-red-100 text-red-800',
}

export function CodeStatusChip({ status }: { status: string }) {
  const cls = CHIP_CONFIG[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {status}
    </span>
  )
}
