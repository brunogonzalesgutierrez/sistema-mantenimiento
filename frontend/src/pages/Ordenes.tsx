import { useState, useEffect } from 'react'
import { client } from '../lib/apollo'
import { cls } from '../styles/common'
import { Pencil, Trash2 } from 'lucide-react'

const QUERY_ORDENES = `
  query {
    ordenesTrabajo {
      id
      descripcionFalla
      prioridad
      estado
      fechaSolicitud
      equipo { id nombre }
      solicitante { id nombre }
      tecnico { id nombre }
    }
    equipos { id nombre }
    usuarios { id nombre rol { nombre } }
  }
`

const CREAR_ORDEN = `
  mutation CrearOrdenTrabajo(
    $equipoId: Int!
    $solicitanteId: Int!
    $descripcionFalla: String!
    $prioridad: String
  ) {
    crearOrdenTrabajo(
      equipoId: $equipoId
      solicitanteId: $solicitanteId
      descripcionFalla: $descripcionFalla
      prioridad: $prioridad
    ) {
      orden { id }
    }
  }
`

const ACTUALIZAR_ORDEN = `
  mutation ActualizarOrdenTrabajo(
    $id: Int!
    $descripcionFalla: String
    $prioridad: String
    $estado: String
    $tecnicoId: Int
  ) {
    actualizarOrdenTrabajo(
      id: $id
      descripcionFalla: $descripcionFalla
      prioridad: $prioridad
      estado: $estado
      tecnicoId: $tecnicoId
    ) {
      orden { id }
    }
  }
`

const ELIMINAR_ORDEN = `
  mutation EliminarOrdenTrabajo($id: Int!) {
    eliminarOrdenTrabajo(id: $id) {
      ok
    }
  }
`

const estadoColor: Record<string, string> = {
  abierta: '#EF4444',
  asignada: '#F59E0B',
  en_proceso: '#3B82F6',
  cerrada: '#10B981',
  cancelada: '#9CA3AF',
}

const estadoLabel: Record<string, string> = {
  abierta: 'Abierta',
  asignada: 'Asignada',
  en_proceso: 'En proceso',
  cerrada: 'Cerrada',
  cancelada: 'Cancelada',
}

const prioridadColor: Record<string, string> = {
  baja: '#9CA3AF',
  media: '#3B82F6',
  alta: '#F59E0B',
  critica: '#EF4444',
}

const formVacio = {
  equipoId: '',
  solicitanteId: '',
  descripcionFalla: '',
  prioridad: 'media',
  estado: 'abierta',
  tecnicoId: '',
}

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState<any[]>([])
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
    client.request(QUERY_ORDENES).then((data: any) => {
      setOrdenes(data.ordenesTrabajo)
      setEquipos(data.equipos)
      setUsuarios(data.usuarios)
      setLoading(false)
    })
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirEditar = (orden: any) => {
    setEditando(orden)
    setForm({
      equipoId: orden.equipo?.id ?? '',
      solicitanteId: orden.solicitante?.id ?? '',
      descripcionFalla: orden.descripcionFalla,
      prioridad: orden.prioridad,
      estado: orden.estado,
      tecnicoId: orden.tecnico?.id ?? '',
    })
    setMostrarModal(true)
  }

  const handleGuardar = async () => {
    if (!form.descripcionFalla) return
    setGuardando(true)

    if (editando) {
      await client.request(ACTUALIZAR_ORDEN, {
        id: parseInt(editando.id),
        descripcionFalla: form.descripcionFalla,
        prioridad: form.prioridad,
        estado: form.estado,
        tecnicoId: form.tecnicoId ? parseInt(form.tecnicoId) : null,
      })
    } else {
      if (!form.equipoId || !form.solicitanteId) return
      await client.request(CREAR_ORDEN, {
        equipoId: parseInt(form.equipoId),
        solicitanteId: parseInt(form.solicitanteId),
        descripcionFalla: form.descripcionFalla,
        prioridad: form.prioridad,
      })
    }

    setForm(formVacio)
    setEditando(null)
    setMostrarModal(false)
    setGuardando(false)
    cargarDatos()
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta orden?')) return
    setEliminando(id)
    await client.request(ELIMINAR_ORDEN, { id })
    setEliminando(null)
    cargarDatos()
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setForm(formVacio)
    setEditando(null)
  }

  const ordenesFiltradas = ordenes.filter((o) =>
    filtroEstado ? o.estado === filtroEstado : true
  )

  if (loading) return <div className={cls.page}><p className="text-gray-400 text-sm">Cargando...</p></div>

  return (
    <div className={cls.page}>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className={cls.pageTitle}>Órdenes de trabajo</h2>
          <p className={cls.pageSubtitle}>{ordenes.length} órdenes registradas</p>
        </div>
        <button className={cls.btnPrimary} onClick={() => setMostrarModal(true)}>
          Nueva orden
        </button>
      </div>

      {/* Filtros */}
      <div className={`${cls.card} mb-5 flex gap-2 flex-wrap`}>
        {['', 'abierta', 'asignada', 'en_proceso', 'cerrada'].map((estado) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              filtroEstado === estado
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {estado === '' ? 'Todas' : estadoLabel[estado]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className={cls.card}>
        <table className={cls.table}>
          <thead>
            <tr>
              {['#', 'Equipo', 'Descripción', 'Solicitante', 'Técnico', 'Prioridad', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className={cls.tableHeader}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-gray-300 text-sm py-8 text-center">
                  No hay órdenes registradas
                </td>
              </tr>
            ) : (
              ordenesFiltradas.map((o: any) => (
                <tr key={o.id}>
                  <td className={cls.tableCell}>#{o.id}</td>
                  <td className={cls.tableCell}>{o.equipo?.nombre ?? '—'}</td>
                  <td className={`${cls.tableCell} max-w-xs truncate`}>{o.descripcionFalla}</td>
                  <td className={cls.tableCell}>{o.solicitante?.nombre ?? '—'}</td>
                  <td className={cls.tableCell}>{o.tecnico?.nombre ?? <span className="text-gray-300">Sin asignar</span>}</td>
                  <td className={cls.tableCell}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full capitalize"
                      style={{
                        backgroundColor: (prioridadColor[o.prioridad] || '#9CA3AF') + '15',
                        color: prioridadColor[o.prioridad] || '#9CA3AF',
                      }}
                    >
                      {o.prioridad}
                    </span>
                  </td>
                  <td className={cls.tableCell}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: (estadoColor[o.estado] || '#9CA3AF') + '15',
                        color: estadoColor[o.estado] || '#9CA3AF',
                      }}
                    >
                      {estadoLabel[o.estado] || o.estado}
                    </span>
                  </td>
                  <td className={cls.tableCell}>
                    <div className="flex gap-1">
                      <button
                        onClick={() => abrirEditar(o)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleEliminar(parseInt(o.id))}
                        disabled={eliminando === parseInt(o.id)}
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
                {editando ? 'Editar orden' : 'Nueva orden de trabajo'}
              </h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {!editando && (
                <>
                  <div>
                    <label className={cls.label}>Equipo *</label>
                    <select className={cls.input} value={form.equipoId} onChange={(e) => setForm({ ...form, equipoId: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {equipos.map((e: any) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={cls.label}>Solicitante *</label>
                    <select className={cls.input} value={form.solicitanteId} onChange={(e) => setForm({ ...form, solicitanteId: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className={cls.label}>Prioridad</label>
                <select className={cls.input} value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
              {editando && (
                <>
                  <div>
                    <label className={cls.label}>Estado</label>
                    <select className={cls.input} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                      <option value="abierta">Abierta</option>
                      <option value="asignada">Asignada</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="cerrada">Cerrada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className={cls.label}>Técnico asignado</label>
                    <select className={cls.input} value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}>
                      <option value="">Sin asignar</option>
                      {usuarios.map((u: any) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="col-span-2">
                <label className={cls.label}>Descripción de la falla *</label>
                <textarea
                  className={`${cls.input} resize-none`}
                  rows={3}
                  value={form.descripcionFalla}
                  onChange={(e) => setForm({ ...form, descripcionFalla: e.target.value })}
                  placeholder="Describe el problema del equipo..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className={cls.btnPrimary} onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear orden'}
              </button>
              <button className={cls.btnSecondary} onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}