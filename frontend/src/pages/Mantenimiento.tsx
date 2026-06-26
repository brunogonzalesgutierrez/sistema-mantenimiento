import { useState, useEffect } from 'react'
import { client } from '../lib/apollo'
import { cls } from '../styles/common'
import { Pencil, Trash2, PlayCircle, CheckCircle } from 'lucide-react'

const QUERY_MANTENIMIENTO = `
  query {
    mantenimientosPreventivos {
      id
      fechaProgramada
      fechaRealizada
      estado
      observaciones
      equipo { id nombre }
      tecnico { id nombre }
    }
    equipos { id nombre }
    usuarios { id nombre }
  }
`

const CREAR_MANTENIMIENTO = `
  mutation CrearMantenimientoPreventivo(
    $equipoId: Int!
    $tecnicoId: Int
    $fechaProgramada: Date!
    $observaciones: String
  ) {
    crearMantenimientoPreventivo(
      equipoId: $equipoId
      tecnicoId: $tecnicoId
      fechaProgramada: $fechaProgramada
      observaciones: $observaciones
    ) {
      mantenimiento { id }
    }
  }
`

const ACTUALIZAR_MANTENIMIENTO = `
  mutation ActualizarMantenimientoPreventivo(
    $id: Int!
    $estado: String
    $fechaRealizada: Date
    $observaciones: String
  ) {
    actualizarMantenimientoPreventivo(
      id: $id
      estado: $estado
      fechaRealizada: $fechaRealizada
      observaciones: $observaciones
    ) {
      mantenimiento { id estado }
    }
  }
`

const ELIMINAR_MANTENIMIENTO = `
  mutation EliminarMantenimientoPreventivo($id: Int!) {
    eliminarMantenimientoPreventivo(id: $id) {
      ok
    }
  }
`

const estadoColor: Record<string, string> = {
  programado: '#3B82F6',
  en_proceso: '#F59E0B',
  completado: '#10B981',
  cancelado: '#9CA3AF',
}

const estadoLabel: Record<string, string> = {
  programado: 'Programado',
  en_proceso: 'En proceso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const formVacio = {
  equipoId: '',
  tecnicoId: '',
  fechaProgramada: '',
  observaciones: '',
  estado: 'programado',
}

export default function Mantenimiento() {
  const [mantenimientos, setMantenimientos] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [editando, setEditando] = useState<any | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargarDatos = () => {
    client.request(QUERY_MANTENIMIENTO).then((data: any) => {
      setMantenimientos(data.mantenimientosPreventivos)
      setEquipos(data.equipos)
      setUsuarios(data.usuarios)
      setLoading(false)
    })
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirEditar = (m: any) => {
    setEditando(m)
    setForm({
      equipoId: m.equipo?.id ?? '',
      tecnicoId: m.tecnico?.id ?? '',
      fechaProgramada: m.fechaProgramada,
      observaciones: m.observaciones || '',
      estado: m.estado,
    })
    setMostrarModal(true)
  }

  const handleGuardar = async () => {
    if (!form.equipoId || !form.fechaProgramada) return
    setGuardando(true)

    if (editando) {
      await client.request(ACTUALIZAR_MANTENIMIENTO, {
        id: parseInt(editando.id),
        estado: form.estado,
        fechaRealizada: form.estado === 'completado' ? new Date().toISOString().split('T')[0] : null,
        observaciones: form.observaciones,
      })
    } else {
      await client.request(CREAR_MANTENIMIENTO, {
        equipoId: parseInt(form.equipoId),
        tecnicoId: form.tecnicoId ? parseInt(form.tecnicoId) : null,
        fechaProgramada: form.fechaProgramada,
        observaciones: form.observaciones,
      })
    }

    setForm(formVacio)
    setEditando(null)
    setMostrarModal(false)
    setGuardando(false)
    cargarDatos()
  }

  const handleCambiarEstado = async (id: number, estado: string) => {
    await client.request(ACTUALIZAR_MANTENIMIENTO, {
      id,
      estado,
      fechaRealizada: estado === 'completado' ? new Date().toISOString().split('T')[0] : null,
    })
    cargarDatos()
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este mantenimiento?')) return
    setEliminando(id)
    await client.request(ELIMINAR_MANTENIMIENTO, { id })
    setEliminando(null)
    cargarDatos()
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setForm(formVacio)
    setEditando(null)
  }

  const filtrados = mantenimientos.filter((m) =>
    filtroEstado ? m.estado === filtroEstado : true
  )

  if (loading) return <div className={cls.page}><p className="text-gray-400 text-sm">Cargando...</p></div>

  return (
    <div className={cls.page}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className={cls.pageTitle}>Mantenimiento preventivo</h2>
          <p className={cls.pageSubtitle}>{mantenimientos.length} mantenimientos registrados</p>
        </div>
        <button className={cls.btnPrimary} onClick={() => setMostrarModal(true)}>
          Programar mantenimiento
        </button>
      </div>

      {/* Filtros */}
      <div className={`${cls.card} mb-5 flex gap-2 flex-wrap`}>
        {['', 'programado', 'en_proceso', 'completado', 'cancelado'].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filtroEstado === estado
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {estado === '' ? 'Todos' : estadoLabel[estado]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className={cls.card}>
        <table className={cls.table}>
          <thead>
            <tr>
              {['#', 'Equipo', 'Técnico', 'Fecha programada', 'Fecha realizada', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className={cls.tableHeader}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-gray-300 text-sm py-8 text-center">
                  No hay mantenimientos registrados
                </td>
              </tr>
            ) : (
              filtrados.map((m: any) => (
                <tr key={m.id}>
                  <td className={cls.tableCell}>#{m.id}</td>
                  <td className={cls.tableCell}>{m.equipo?.nombre ?? '—'}</td>
                  <td className={cls.tableCell}>{m.tecnico?.nombre ?? <span className="text-gray-300">Sin asignar</span>}</td>
                  <td className={cls.tableCell}>{m.fechaProgramada}</td>
                  <td className={cls.tableCell}>{m.fechaRealizada ?? <span className="text-gray-300">—</span>}</td>
                  <td className={cls.tableCell}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: (estadoColor[m.estado] || '#9CA3AF') + '15',
                        color: estadoColor[m.estado] || '#9CA3AF',
                      }}
                    >
                      {estadoLabel[m.estado] || m.estado}
                    </span>
                  </td>
                  <td className={cls.tableCell}>
                    <div className="flex gap-1">
                      {m.estado === 'programado' && (
                        <button
                          onClick={() => handleCambiarEstado(parseInt(m.id), 'en_proceso')}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          title="Iniciar"
                        >
                          <PlayCircle size={15} />
                        </button>
                      )}
                      {m.estado === 'en_proceso' && (
                        <button
                          onClick={() => handleCambiarEstado(parseInt(m.id), 'completado')}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                          title="Completar"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => abrirEditar(m)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleEliminar(parseInt(m.id))}
                        disabled={eliminando === parseInt(m.id)}
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
                {editando ? 'Editar mantenimiento' : 'Programar mantenimiento'}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cls.label}>Equipo *</label>
                <select
                  className={cls.input}
                  value={form.equipoId}
                  onChange={(e) => setForm({ ...form, equipoId: e.target.value })}
                  disabled={!!editando}
                >
                  <option value="">Seleccionar...</option>
                  {equipos.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={cls.label}>Técnico</label>
                <select
                  className={cls.input}
                  value={form.tecnicoId}
                  onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}
                >
                  <option value="">Sin asignar</option>
                  {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={cls.label}>Fecha programada *</label>
                <input
                  type="date"
                  className={cls.input}
                  value={form.fechaProgramada}
                  onChange={(e) => setForm({ ...form, fechaProgramada: e.target.value })}
                  disabled={!!editando}
                />
              </div>
              {editando && (
                <div>
                  <label className={cls.label}>Estado</label>
                  <select
                    className={cls.input}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    <option value="programado">Programado</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="completado">Completado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className={cls.label}>Observaciones</label>
                <textarea
                  className={`${cls.input} resize-none`}
                  rows={3}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className={cls.btnPrimary} onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Programar'}
              </button>
              <button className={cls.btnSecondary} onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}