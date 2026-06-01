export interface ContainerData {
  id: number
  label: string
  pos_x: number
  pos_y: number
  active: boolean
  current_status: string | null
  current_photo_url: string | null
}

interface Props {
  containers: ContainerData[]
  selectedId: number | null
  onSelect: (id: number) => void
}

const STATUS_BG: Record<string, string> = {
  EMPTY:    'bg-status-empty',
  HALF:     'bg-status-half',
  FULL:     'bg-status-full',
  OVERFLOW: 'bg-status-overflow',
}

export function ContainerMap({ containers, selectedId, onSelect }: Props) {
  return (
    <div className="relative w-full" style={{ paddingBottom: '60%' }}>
      {/* Planta del edificio (placeholder SVG) */}
      <div className="absolute inset-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 120"
          preserveAspectRatio="xMidYMid meet"
          className="text-slate-300"
        >
          {/* Perímetro del edificio */}
          <rect x="8" y="8" width="184" height="104" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" rx="4" />
          {/* Divisiones internas */}
          <line x1="8"   y1="60" x2="192" y2="60" stroke="#e2e8f0" strokeWidth="0.8" />
          <line x1="72"  y1="8"  x2="72"  y2="112" stroke="#e2e8f0" strokeWidth="0.8" />
          <line x1="130" y1="8"  x2="130" y2="112" stroke="#e2e8f0" strokeWidth="0.8" />
          {/* Etiqueta */}
          <text x="100" y="116" textAnchor="middle" fontSize="5" fill="#94a3b8">Zona de contenedores</text>
        </svg>
      </div>

      {/* Pines de contenedores */}
      {containers.map((c) => {
        const status = c.current_status
        const bgClass = status ? (STATUS_BG[status] ?? 'bg-slate-300') : 'bg-slate-300'
        const isSelected = selectedId === c.id
        const isOverflow = status === 'OVERFLOW'

        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            style={{
              position: 'absolute',
              left: `${c.pos_x * 100}%`,
              top: `${c.pos_y * 100}%`,
              transform: `translate(-50%, -50%) ${isSelected ? 'scale(1.2)' : 'scale(1)'}`,
              transition: 'transform 0.15s ease',
            }}
            className="flex flex-col items-center gap-0.5 focus:outline-none"
            title={c.label}
          >
            <div className="relative flex items-center justify-center">
              {/* Pulso para OVERFLOW */}
              {isOverflow && (
                <span
                  className={`absolute inline-flex rounded-full opacity-60 animate-ping ${bgClass}`}
                  style={{ width: 40, height: 40 }}
                />
              )}
              {/* Pin */}
              <div
                className={`rounded-full transition-colors duration-300 ${bgClass} ${isSelected ? 'ring-2 ring-white ring-offset-1' : ''}`}
                style={{ width: 36, height: 36 }}
              />
            </div>
            {/* Etiqueta */}
            <span className="text-[9px] font-semibold text-slate-600 bg-white/80 rounded px-1 leading-tight whitespace-nowrap">
              {c.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
