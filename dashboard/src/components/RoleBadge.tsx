const ROLE_CONFIG: Record<string, string> = {
  ADMIN:      'bg-red-100 text-red-800',
  RESEARCHER: 'bg-blue-100 text-blue-800',
  VIEWER:     'bg-gray-100 text-gray-700',
  RESIDENT:   'bg-green-100 text-green-800',
}

export function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_CONFIG[role] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {role}
    </span>
  )
}
