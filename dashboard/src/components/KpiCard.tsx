interface Props {
  title: string
  value: React.ReactNode
  subtitle?: React.ReactNode
}

export function KpiCard({ title, value, subtitle }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded shadow p-4 text-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      <div className="text-3xl font-bold text-gray-800 my-2 flex items-center justify-center">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-400 italic">{subtitle}</p>
      )}
    </div>
  )
}
