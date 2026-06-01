import { useEffect } from 'react'

interface Props {
  src: string
  alt?: string
  onClose: () => void
}

export function PhotoModal({ src, alt = 'Foto', onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center text-lg font-bold hover:bg-black/80 transition-colors"
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Imagen — clic en ella no cierra el modal */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
      />
    </div>
  )
}
