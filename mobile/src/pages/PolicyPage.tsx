import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  { title: '1. Responsable del tratamiento', body: 'La administración del conjunto residencial es responsable del tratamiento de los datos recopilados a través de esta aplicación.' },
  { title: '2. Datos recopilados', body: '• Alias de usuario (seudónimo)\n• Código de acceso de 8 caracteres\n• Estado del contenedor reportado (VACÍO, MEDIO, LLENO, DESBORDADO)\n• Token de notificaciones push' },
  { title: '3. Finalidad', body: '• Mostrar el estado actual del contenedor\n• Generar estadísticas agregadas sin identificación individual\n• Enviar notificaciones de recolección\n• Producir la cartelera informativa del conjunto' },
  { title: '4. Anonimato', body: 'No se recopilan nombres reales, cédulas, teléfonos ni correos. El alias es un seudónimo de libre elección.' },
  { title: '5. Conservación', body: 'Los reportes individuales se eliminan automáticamente 30 días después de su creación.' },
  { title: '6. Tus derechos', body: 'Puedes consultar, rectificar y eliminar tus datos en cualquier momento desde Configuración → Eliminar mi cuenta y datos.' },
  { title: '7. Seguridad', body: 'La comunicación usa HTTPS/TLS. El token de sesión se almacena en el almacenamiento local del navegador.' },
  { title: '8. Código abierto', body: 'El código fuente de esta aplicación es público y auditable.' },
]

export function PolicyPage() {
  const navigate = useNavigate()

  return (
    <div className="p-5 space-y-5 pb-10">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-blue-500 font-semibold"
      >
        ← Volver
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-800">Política de tratamiento de datos</h1>
        <p className="text-sm text-slate-400 mt-1">Conjunto Residencial — App Gestión de Basuras</p>
      </div>

      {SECTIONS.map((s) => (
        <div key={s.title} className="bg-white rounded-2xl shadow p-5 space-y-2">
          <p className="font-bold text-slate-700 text-sm">{s.title}</p>
          <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{s.body}</p>
        </div>
      ))}

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
        <p className="text-sm text-green-800 leading-relaxed">
          Al usar esta aplicación el residente acepta este tratamiento de datos.
          Para preguntas, contacta a la administración del conjunto.
        </p>
      </div>
    </div>
  )
}
