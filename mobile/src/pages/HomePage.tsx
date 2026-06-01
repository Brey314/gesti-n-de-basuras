import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useToast } from '../components/Toast'
import { ContainerMap, type ContainerData } from '../components/ContainerMap'
import { PhotoModal } from '../components/PhotoModal'

const STATUS_LABELS: Record<string, string> = {
  EMPTY: 'VACÍO', HALF: 'MEDIO', FULL: 'LLENO', OVERFLOW: 'DESBORDADO',
}
const STATUS_TEXT: Record<string, string> = {
  EMPTY: 'text-status-empty', HALF: 'text-status-half',
  FULL: 'text-status-full',  OVERFLOW: 'text-status-overflow',
}
const OVERFLOW_ORDER = ['OVERFLOW', 'FULL', 'HALF', 'EMPTY']

const REPORT_OPTIONS = [
  { key: 'EMPTY',    emoji: '🟢', label: 'VACÍO',      textClass: 'text-status-empty',    borderClass: 'border-status-empty' },
  { key: 'HALF',     emoji: '🟡', label: 'MEDIO',      textClass: 'text-status-half',     borderClass: 'border-status-half' },
  { key: 'FULL',     emoji: '🔴', label: 'LLENO',      textClass: 'text-status-full',     borderClass: 'border-status-full' },
  { key: 'OVERFLOW', emoji: '🚨', label: 'DESBORDADO', textClass: 'text-status-overflow', borderClass: 'border-status-overflow' },
]

async function pixelateImage(file: File, pixelSize = 10): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const maxW = 800
      const scale = img.width > maxW ? maxW / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      const sw = Math.max(1, Math.ceil(w / pixelSize))
      const sh = Math.max(1, Math.ceil(h / pixelSize))
      ctx.drawImage(img, 0, 0, sw, sh)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, w, h)
      canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85)
    }
    img.src = URL.createObjectURL(file)
  })
}

function worstStatus(containers: ContainerData[]): string | null {
  for (const s of OVERFLOW_ORDER) {
    if (containers.some((c) => c.current_status === s)) return s
  }
  return null
}

export function HomePage() {
  const { showToast } = useToast()
  const [containers, setContainers] = useState<ContainerData[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sheet, setSheet] = useState(false)
  const [submittingStatus, setSubmittingStatus] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [modalSrc, setModalSrc] = useState<string | null>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchContainers = async () => {
    try {
      const res = await api.get('/containers/')
      setContainers(res.data)
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchContainers()
    const id = setInterval(fetchContainers, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!sheet) return
    const handler = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) closeSheet()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sheet])

  const openSheet = (id: number) => {
    setSelectedId(id)
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
    setSheet(true)
  }

  const closeSheet = () => {
    setSheet(false)
    setPhotoFile(null)
    setPhotoPreviewUrl(null)
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Limpiar el value para poder seleccionar el mismo archivo dos veces
    e.target.value = ''
    setPhotoFile(file)
    const blob = await pixelateImage(file)
    setPhotoPreviewUrl(URL.createObjectURL(blob))
  }

  const handleReport = async (status: string) => {
    setSubmittingStatus(status)
    try {
      const res = await api.post('/reports/', {
        status,
        container_id: selectedId,
      })
      if (photoFile) {
        const blob = await pixelateImage(photoFile)
        const fd = new FormData()
        fd.append('file', blob, 'photo.jpg')
        await api.post(`/reports/${res.data.id}/photo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      showToast('Reporte enviado ✓', 'success')
      closeSheet()
      fetchContainers()
    } catch {
      showToast('Error al enviar el reporte', 'error')
    } finally {
      setSubmittingStatus(null)
    }
  }

  const selectedContainer = containers.find((c) => c.id === selectedId)
  const worst = worstStatus(containers)
  const worstLabel = worst ? STATUS_LABELS[worst] : null
  const worstTextClass = worst ? (STATUS_TEXT[worst] ?? 'text-slate-400') : 'text-slate-400'
  const isSubmitting = submittingStatus !== null

  // Contenedor con foto más reciente para mostrar en el panel de detalle
  const containersWithPhoto = containers.filter((c) => c.current_status && c.current_photo_url)

  return (
    <div className="page-container">
      {/* Mapa de contenedores */}
      <div className="card card-body space-y-3">
        <p className="section-label">Estado de los contenedores</p>
        <ContainerMap
          containers={containers}
          selectedId={selectedId}
          onSelect={openSheet}
        />
        {containers.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Cargando contenedores…</p>
        )}
        {worst && (
          <p className="text-sm text-center text-slate-500">
            Estado general:{' '}
            <span className={`font-bold ${worstTextClass}`}>{worstLabel}</span>
          </p>
        )}
        {!worst && containers.length > 0 && (
          <p className="text-sm text-center text-slate-400">Sin reportes recientes</p>
        )}
      </div>

      {/* Fotos de reportes activos */}
      {containersWithPhoto.length > 0 && (
        <div className="card card-body space-y-2">
          <p className="section-label">Fotos del estado actual</p>
          <div className="flex flex-col gap-3">
            {containersWithPhoto.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <button
                  onClick={() => setModalSrc(c.current_photo_url!)}
                  className="shrink-0 rounded-xl overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity active:scale-95"
                >
                  <img
                    src={c.current_photo_url!}
                    alt={`Foto ${c.label}`}
                    className="w-20 h-20 object-cover"
                  />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700">{c.label}</p>
                  <p className={`text-sm font-semibold ${STATUS_TEXT[c.current_status!] ?? 'text-slate-500'}`}>
                    {STATUS_LABELS[c.current_status!] ?? c.current_status}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Toca la foto para ampliar</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modalSrc && (
        <PhotoModal src={modalSrc} onClose={() => setModalSrc(null)} />
      )}

      <p className="text-xs text-slate-400 text-center -mt-1">
        Toca un contenedor para reportar su estado
      </p>

      {/* Bottom sheet */}
      {sheet && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end">
          <div
            ref={sheetRef}
            className="w-full max-w-[430px] mx-auto bg-white rounded-t-2xl p-6 pb-10 space-y-3 animate-[slideUp_.25s_ease-out]"
          >
            {/* Encabezado */}
            <p className="text-center font-bold text-slate-700">
              {selectedContainer?.label ?? 'Contenedor'}
            </p>

            {/* Foto opcional — visible desde el inicio */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {photoPreviewUrl ? (
              <div className="relative">
                <img
                  src={photoPreviewUrl}
                  alt="Vista previa"
                  className="w-full rounded-xl object-cover max-h-40"
                />
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreviewUrl(null) }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                  aria-label="Quitar foto"
                >
                  ✕
                </button>
                <p className="text-xs text-slate-400 text-center mt-1">
                  Imagen pixelada automáticamente para proteger la privacidad
                </p>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-full text-sm"
                disabled={isSubmitting}
              >
                📷 Adjuntar foto (opcional)
              </button>
            )}

            {/* Selector de estado — el clic envía directamente */}
            <p className="text-center text-sm text-slate-500">¿Cómo está el contenedor?</p>
            {REPORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleReport(opt.key)}
                disabled={isSubmitting}
                className={`w-full flex items-center gap-4 py-4 px-5 rounded-xl border-2 font-bold text-lg active:scale-[.98] transition-transform disabled:opacity-60 ${opt.textClass} ${opt.borderClass}`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                {submittingStatus === opt.key ? 'Enviando…' : opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
