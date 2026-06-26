import { useState } from 'react'
import { client } from '../lib/apollo'

const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      usuario {
        id
        nombre
        rol {
          nombre
        }
      }
      error
    }
  }
`

interface Props {
  onLogin: (token: string) => void
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const data: any = await client.request(LOGIN_MUTATION, { email, password })
      if (data.login.error) {
        setError(data.login.error)
        return
      }
      onLogin(data.login.token)
    } catch (e) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-white text-2xl font-medium mb-2">Sistema de Mantenimiento</h1>
        <p className="text-gray-400 text-sm mb-6">Ingresa tus credenciales para continuar</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 text-sm px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="text-gray-300 text-sm block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="usuario@sistema.com"
          />
        </div>

        <div className="mb-6">
          <label className="text-gray-300 text-sm block mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-medium transition-colors"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}