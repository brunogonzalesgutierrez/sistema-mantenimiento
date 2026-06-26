import { useState, useEffect } from 'react'
import { client } from '../lib/apollo'
import { cls } from '../styles/common'

const QUERY_DASHBOARD = `
  query {
    equipos {
      id
      estado
    }
    ordenesTrabajo {
      id
      estado
      prioridad
    }
    mantenimientosPreventivos {
      id
      estado
    }
    alertas(leida: false) {
      id
      tipo
      mensaje
    }
  }
`

export default function Dashboard() {
  const [kpi, setKpi] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.request(QUERY_DASHBOARD).then((data: any) => {
      const equipos = data.equipos
      const ordenes = data.ordenesTrabajo
      const mantenimientos = data.mantenimientosPreventivos
      const alertas = data.alertas
      setKpi({
        equiposTotal: equipos.length,
        equiposOperativos: equipos.filter((e: any) => e.estado === 'operativo').length,
        equiposEnMantenimiento: equipos.filter((e: any) => e.estado === 'en_mantenimiento').length,
        ordenesAbiertas: ordenes.filter((o: any) => ['abierta', 'asignada', 'en_proceso'].includes(o.estado)).length,
        ordenesCriticas: ordenes.filter((o: any) => o.prioridad === 'critica').length,
        mantenimientosPendientes: mantenimientos.filter((m: any) => m.estado === 'programado').length,
        alertasNoLeidas: alertas.length,
        ultimasOrdenes: ordenes.slice(0, 4),
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className={cls.page}><p className="text-gray-400 text-sm">Cargando...</p></div>

  const tarjetas = [
    { titulo: 'Total equipos', valor: kpi?.equiposTotal ?? 0, sub: `${kpi?.equiposOperativos ?? 0} operativos` },
    { titulo: 'En mantenimiento', valor: kpi?.equiposEnMantenimiento ?? 0, sub: 'Equipos fuera de línea' },
    { titulo: 'Órdenes abiertas', valor: kpi?.ordenesAbiertas ?? 0, sub: `${kpi?.ordenesCriticas ?? 0} críticas` },
    { titulo: 'Mantenimientos pendientes', valor: kpi?.mantenimientosPendientes ?? 0, sub: 'Programados sin realizar' },
  ]

  const estadoLabel: Record<string, string> = {
    abierta: 'Abierta',
    asignada: 'Asignada',
    en_proceso: 'En proceso',
    cerrada: 'Cerrada',
    cancelada: 'Cancelada',
  }

  const estadoColor: Record<string, string> = {
    abierta: '#EF4444',
    asignada: '#F59E0B',
    en_proceso: '#3B82F6',
    cerrada: '#10B981',
    cancelada: '#9CA3AF',
  }

  return (
    <div className={cls.page}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className={cls.pageTitle}>Bienvenido</h2>
          <p className={cls.pageSubtitle}>Resumen general del sistema</p>
        </div>
        {kpi?.alertasNoLeidas > 0 && (
          <div className="text-xs bg-red-50 text-red-500 border border-red-100 px-3 py-1.5 rounded-full">
            {kpi.alertasNoLeidas} alertas sin leer
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tarjetas.map((t) => (
          <div key={t.titulo} className={cls.card}>
            <p className="text-gray-400 text-xs mb-3">{t.titulo}</p>
            <p className="text-gray-900 text-4xl font-medium mb-1">{t.valor}</p>
            <p className="text-gray-400 text-xs">{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ultimas ordenes */}
        <div className={cls.card}>
          <h3 className={`${cls.cardTitle} mb-5`}>Últimas órdenes de trabajo</h3>
          {kpi?.ultimasOrdenes?.length === 0 ? (
            <p className="text-gray-300 text-sm">No hay órdenes registradas</p>
          ) : (
            <div>
              {kpi?.ultimasOrdenes?.map((o: any, i: number) => (
                <div
                  key={o.id}
                  className={`flex items-center justify-between py-3 ${i < kpi.ultimasOrdenes.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                      #{o.id}
                    </div>
                    <div>
                      <p className="text-gray-700 text-sm">Orden de trabajo</p>
                      <p className="text-gray-400 text-xs capitalize">Prioridad {o.prioridad}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: (estadoColor[o.estado] || '#9CA3AF') + '15',
                      color: estadoColor[o.estado] || '#9CA3AF',
                    }}
                  >
                    {estadoLabel[o.estado] || o.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estado equipos */}
        <div className={cls.card}>
          <h3 className={`${cls.cardTitle} mb-5`}>Estado de equipos</h3>

          <div className="space-y-4 mb-6">
            {[
              { label: 'Operativos', valor: kpi?.equiposOperativos ?? 0, color: '#10B981' },
              { label: 'En mantenimiento', valor: kpi?.equiposEnMantenimiento ?? 0, color: '#F59E0B' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-gray-400">{item.valor} / {kpi?.equiposTotal ?? 0}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${kpi?.equiposTotal > 0 ? (item.valor / kpi.equiposTotal) * 100 : 0}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-50 pt-5">
            <p className="text-gray-400 text-xs mb-3">Resumen rápido</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Mantenimientos</p>
                <p className="text-gray-800 text-2xl font-medium">{kpi?.mantenimientosPendientes ?? 0}</p>
                <p className="text-gray-400 text-xs mt-1">pendientes</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-xs mb-1">Alertas</p>
                <p className="text-2xl font-medium" style={{ color: kpi?.alertasNoLeidas > 0 ? '#EF4444' : '#9CA3AF' }}>
                  {kpi?.alertasNoLeidas ?? 0}
                </p>
                <p className="text-gray-400 text-xs mt-1">sin leer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}