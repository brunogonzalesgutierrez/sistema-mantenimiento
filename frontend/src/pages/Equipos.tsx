import { useState, useEffect } from 'react'
import { client } from '../lib/apollo'
import { cls } from '../styles/common'
import { Pencil, Trash2 } from 'lucide-react'

const QUERY_EQUIPOS = `
  query {
    equipos {
      id
      nombre
      marca
      modelo
      numeroSerie
      estado
      tipoEquipo { id nombre }
      ubicacion { id nombre area }
    }
    tiposEquipo { id nombre }
    ubicaciones { id nombre area }
  }
`

const CREAR_EQUIPO = `
  mutation CrearEquipo(
    $nombre: String!
    $marca: String
    $modelo: String
    $numeroSerie: String
    $tipoEquipoId: Int!
    $ubicacionId: Int
    $estado: String
  ) {
    crearEquipo(
      nombre: $nombre
      marca: $marca
      modelo: $modelo
      numeroSerie: $numeroSerie
      tipoEquipoId: $tipoEquipoId
      ubicacionId: $ubicacionId
      estado: $estado
    ) {
      equipo { id nombre }
    }
  }
`

const ELIMINAR_EQUIPO = `
  mutation EliminarEquipo($id: Int!) {
    eliminarEquipo(id: $id) {
      ok
    }
  }
`

const ACTUALIZAR_ESTADO_EQUIPO = `
  mutation ActualizarEstadoEquipo($id: Int!, $estado: String!, $usuarioId: Int!) {
    actualizarEstadoEquipo(id: $id, estado: $estado, usuarioId: $usuarioId) {
      equipo { id estado }
    }
  }
`

const ACTUALIZAR_EQUIPO = `
  mutation ActualizarEquipo(
    $id: Int!
    $nombre: String
    $marca: String
    $modelo: String
    $numeroSerie: String
    $tipoEquipoId: Int
    $ubicacionId: Int
    $estado: String
  ) {
    actualizarEquipo(
      id: $id
      nombre: $nombre
      marca: $marca
      modelo: $modelo
      numeroSerie: $numeroSerie
      tipoEquipoId: $tipoEquipoId
      ubicacionId: $ubicacionId
      estado: $estado
    ) {
      equipo { id nombre }
    }
  }
`

const estadoColor: Record<string, string> = {
  operativo: '#10B981',
  en_mantenimiento: '#F59E0B',
  fuera_de_servicio: '#EF4444',
  dado_de_baja: '#9CA3AF',
}

const estadoLabel: Record<string, string> = {
  operativo: 'Operativo',
  en_mantenimiento: 'En mantenimiento',
  fuera_de_servicio: 'Fuera de servicio',
  dado_de_baja: 'Dado de baja',
}

const formVacio = {
  nombre: '',
  marca: '',
  modelo: '',
  numeroSerie: '',
  tipoEquipoId: '',
  ubicacionId: '',
  estado: 'operativo',
}

export default function Equipos() {
  const [equipos, setEquipos] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [ubicaciones, setUbicaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [editando, setEditando] = useState<any | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const cargarDatos = () => {
    client.request(QUERY_EQUIPOS).then((data: any) => {
      setEquipos(data.equipos)
      setTipos(data.tiposEquipo)
      setUbicaciones(data.ubicaciones)
      setLoading(false)
    })
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirEditar = (equipo: any) => {
    setEditando(equipo)
    setForm({
      nombre: equipo.nombre,
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      numeroSerie: equipo.numeroSerie || '',
      tipoEquipoId: equipo.tipoEquipo?.id ?? '',
      ubicacionId: equipo.ubicacion?.id ?? '',
      estado: equipo.estado,
    })
    setMostrarModal(true)
  }

  const handleGuardar = async () => {
    if (!form.nombre || !form.tipoEquipoId) return
    setGuardando(true)

        if (editando) {
      await client.request(ACTUALIZAR_EQUIPO, {
        id: parseInt(editando.id),  // <- agregar parseInt aquí
        nombre: form.nombre,
        marca: form.marca,
        modelo: form.modelo,
        numeroSerie: form.numeroSerie,
        tipoEquipoId: parseInt(form.tipoEquipoId),
        ubicacionId: form.ubicacionId ? parseInt(form.ubicacionId) : null,
        estado: form.estado,
      })
    }
    else {
      await client.request(CREAR_EQUIPO, {
        nombre: form.nombre,
        marca: form.marca,
        modelo: form.modelo,
        numeroSerie: form.numeroSerie,
        tipoEquipoId: parseInt(form.tipoEquipoId),
        ubicacionId: form.ubicacionId ? parseInt(form.ubicacionId) : null,
        estado: form.estado,
      })
    }

    setForm(formVacio)
    setEditando(null)
    setMostrarModal(false)
    setGuardando(false)
    cargarDatos()
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este equipo?')) return
    setEliminando(id)
    await client.request(ELIMINAR_EQUIPO, { id })
    setEliminando(null)
    cargarDatos()
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setForm(formVacio)
    setEditando(null)
  }

  const equiposFiltrados = equipos.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
    e.numeroSerie?.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (loading) return <div className={cls.page}><p className="text-gray-400 text-sm">Cargando...</p></div>

  return (
    <div className={cls.page}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className={cls.pageTitle}>Equipos</h2>
          <p className={cls.pageSubtitle}>{equipos.length} equipos registrados</p>
        </div>
        <button className={cls.btnPrimary} onClick={() => setMostrarModal(true)}>
          Agregar equipo
        </button>
      </div>

      {/* Busqueda */}
      <div className={`${cls.card} mb-5`}>
        <input
          className={cls.input}
          placeholder="Buscar por nombre, marca o número de serie..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className={cls.card}>
        <table className={cls.table}>
          <thead>
            <tr>
              {['Nombre', 'Tipo', 'Marca / Modelo', 'N° Serie', 'Ubicación', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className={cls.tableHeader}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {equiposFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-gray-300 text-sm py-8 text-center">
                  No hay equipos registrados
                </td>
              </tr>
            ) : (
              equiposFiltrados.map((e: any) => (
                <tr key={e.id}>
                  <td className={cls.tableCell}>{e.nombre}</td>
                  <td className={cls.tableCell}>{e.tipoEquipo?.nombre ?? '—'}</td>
                  <td className={cls.tableCell}>{e.marca} {e.modelo}</td>
                  <td className={cls.tableCell}>{e.numeroSerie || '—'}</td>
                  <td className={cls.tableCell}>{e.ubicacion ? `${e.ubicacion.nombre} - ${e.ubicacion.area}` : '—'}</td>
                  <td className={cls.tableCell}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: (estadoColor[e.estado] || '#9CA3AF') + '15',
                        color: estadoColor[e.estado] || '#9CA3AF',
                      }}
                    >
                      {estadoLabel[e.estado] || e.estado}
                    </span>
                  </td>
                  <td className={cls.tableCell}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirEditar(e)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleEliminar(e.id)}
                        disabled={eliminando === e.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={(e) => { if (e.target === e.currentTarget) cerrarModal() }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-800 font-medium">
                {editando ? 'Editar equipo' : 'Nuevo equipo'}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cls.label}>Nombre *</label>
                <input
                  className={cls.input}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: PC Recepción"
                  
                />
              </div>
              <div>
                <label className={cls.label}>Tipo de equipo *</label>
                <select
                  className={cls.input}
                  value={form.tipoEquipoId}
                  onChange={(e) => setForm({ ...form, tipoEquipoId: e.target.value })}
                  
                >
                  <option value="">Seleccionar...</option>
                  {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={cls.label}>Marca</label>
                <input
                  className={cls.input}
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  placeholder="Ej: Dell"
                 
                />
              </div>
              <div>
                <label className={cls.label}>Modelo</label>
                <input
                  className={cls.input}
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                  placeholder="Ej: OptiPlex 7090"
                  
                />
              </div>
              <div>
                <label className={cls.label}>Número de serie</label>
                <input
                  className={cls.input}
                  value={form.numeroSerie}
                  onChange={(e) => setForm({ ...form, numeroSerie: e.target.value })}
                  placeholder="Ej: ABC123456"
                  
                />
              </div>
              <div>
                <label className={cls.label}>Ubicación</label>
                <select
                  className={cls.input}
                  value={form.ubicacionId}
                  onChange={(e) => setForm({ ...form, ubicacionId: e.target.value })}
                  
                >
                  <option value="">Seleccionar...</option>
                  {ubicaciones.map((u: any) => <option key={u.id} value={u.id}>{u.nombre} - {u.area}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className={cls.label}>Estado</label>
                <select
                  className={cls.input}
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                >
                  <option value="operativo">Operativo</option>
                  <option value="en_mantenimiento">En mantenimiento</option>
                  <option value="fuera_de_servicio">Fuera de servicio</option>
                  <option value="dado_de_baja">Dado de baja</option>
                </select>
              </div>
            </div>

            {editando && (
              <p className="text-gray-400 text-xs mt-3">
                Solo se puede modificar el estado del equipo.
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button className={cls.btnPrimary} onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar equipo'}
              </button>
              <button className={cls.btnSecondary} onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}