interface Props {
  paginaActual: string
  onNavegar: (pagina: string) => void
  onCerrarSesion: () => void
}

const menu = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'equipos', label: 'Equipos' },
  { id: 'ordenes', label: 'Órdenes de trabajo' },
  { id: 'mantenimiento', label: 'Mantenimiento' },
  { id: 'usuarios', label: 'Usuarios' },
]

export default function Sidebar({ paginaActual, onNavegar, onCerrarSesion }: Props) {
  return (
    <div className="w-52 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 mb-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-gray-800 rounded-lg" />
          <span className="text-gray-800 font-medium text-sm">Mantenimiento TI</span>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {menu.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavegar(item.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-colors
              ${paginaActual === item.id
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 mt-auto">
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={onCerrarSesion}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}