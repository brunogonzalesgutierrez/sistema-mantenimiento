import { useState } from 'react'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Equipos from './pages/Equipos'
import Ordenes from './pages/Ordenes'
import Mantenimiento from './pages/Mantenimiento'
import Usuarios from './pages/Usuarios'

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [pagina, setPagina] = useState('dashboard')

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  if (!token) {
    return <Login onLogin={(t) => {
      localStorage.setItem('token', t)
      setToken(t)
    }} />
  }

  const renderPagina = () => {
    switch (pagina) {
      case 'dashboard': return <Dashboard />
      case 'equipos': return <Equipos />
      case 'ordenes': return <Ordenes />
      case 'mantenimiento': return <Mantenimiento />
      case 'usuarios': return <Usuarios />
      default: return <Dashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        paginaActual={pagina}
        onNavegar={setPagina}
        onCerrarSesion={cerrarSesion}
      />
      <main className="flex-1 overflow-auto">
        {renderPagina()}
      </main>
    </div>
  )
}

export default App