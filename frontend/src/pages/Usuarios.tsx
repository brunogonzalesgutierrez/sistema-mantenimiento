import { useState, useEffect } from 'react'
import { client } from '../lib/apollo'
import { cls } from '../styles/common'

const QUERY_USUARIOS = `
  query {
    usuarios {
      id
      nombre
      email
      activo
      createdAt
      rol { id nombre }
    }
    roles { id nombre }
  }
`

const CREAR_USUARIO = `
  mutation CrearUsuario(
    $nombre: String!
    $email: String!
    $passwordHash: String!
    $rolId: Int!
  ) {
    crearUsuario(
      nombre: $nombre
      email: $email
      passwordHash: $passwordHash
      rolId: $rolId
    ) {
      usuario { id nombre }
    }
  }
`

const ELIMINAR_USUARIO = `
  mutation EliminarUsuario($id: Int!) {
    eliminarUsuario(id: $id) {
      ok
    }
  }
`

const rolColor: Record<string, string> = {
  Administrador: '#8B5CF6',
  Técnico: '#3B82F6',
  Solicitante: '#10B981',
}

const formVacio = {
  nombre: '',
  email: '',
  password: '',
  rolId: '',
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [form, setForm] = useState(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState<number | null>(null)

  const cargarDatos = () => {
    client.request(QUERY_USUARIOS).then((data: any) => {
      setUsuarios(data.usuarios)
      setRoles(data.roles)
      setLoading(false)
    })
  }

  useEffect(() => { cargarDatos() }, [])

  const handleGuardar = async () => {
    if (!form.nombre || !form.email || !form.password || !form.rolId) return
    setGuardando(true)
    await client.request(CREAR_USUARIO, {
      nombre: form.nombre,
      email: form.email,
      passwordHash: form.password,
      rolId: parseInt(form.rolId),
    })
    setForm(formVacio)
    setMostrarModal(false)
    setGuardando(false)
    cargarDatos()
  }

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return
    setEliminando(id)
    await client.request(ELIMINAR_USUARIO, { id })
    setEliminando(null)
    cargarDatos()
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setForm(formVacio)
  }

  if (loading) return <div className={cls.page}><p className="text-gray-400 text-sm">Cargando...</p></div>

  return (
    <div className={cls.page}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className={cls.pageTitle}>Usuarios</h2>
          <p className={cls.pageSubtitle}>{usuarios.length} usuarios registrados</p>
        </div>
        <button className={cls.btnPrimary} onClick={() => setMostrarModal(true)}>
          Agregar usuario
        </button>
      </div>

      {/* Tabla */}
      <div className={cls.card}>
        <table className={cls.table}>
          <thead>
            <tr>
              {['Nombre', 'Email', 'Rol', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className={cls.tableHeader}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-gray-300 text-sm py-8 text-center">
                  No hay usuarios registrados
                </td>
              </tr>
            ) : (
              usuarios.map((u: any) => (
                <tr key={u.id}>
                  <td className={cls.tableCell}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      {u.nombre}
                    </div>
                  </td>
                  <td className={cls.tableCell}>{u.email}</td>
                  <td className={cls.tableCell}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: (rolColor[u.rol.nombre] || '#9CA3AF') + '15',
                        color: rolColor[u.rol.nombre] || '#9CA3AF',
                      }}
                    >
                      {u.rol.nombre}
                    </span>
                  </td>
                  <td className={cls.tableCell}>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: u.activo ? '#10B98115' : '#9CA3AF15',
                        color: u.activo ? '#10B981' : '#9CA3AF',
                      }}
                    >
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={cls.tableCell}>
                    <button
                      className={cls.btnDanger}
                      onClick={() => handleEliminar(u.id)}
                      disabled={eliminando === u.id}
                    >
                      {eliminando === u.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-800 font-medium">Nuevo usuario</h3>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={cls.label}>Nombre completo *</label>
                <input
                  className={cls.input}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className={cls.label}>Email *</label>
                <input
                  type="email"
                  className={cls.input}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="juan@sistema.com"
                />
              </div>
              <div>
                <label className={cls.label}>Contraseña *</label>
                <input
                  type="password"
                  className={cls.input}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className={cls.label}>Rol *</label>
                <select
                  className={cls.input}
                  value={form.rolId}
                  onChange={(e) => setForm({ ...form, rolId: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className={cls.btnPrimary} onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Crear usuario'}
              </button>
              <button className={cls.btnSecondary} onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}