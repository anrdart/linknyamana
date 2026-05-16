import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp, BarChart3, PieChartIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface AnalyticsData {
  statusData: { name: string; value: number }[]
  uptimeData: { date: string; uptime: number }[]
  progressData: { category: string; total: number; completed: number }[]
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1']

export function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Uptime Trend (30d)</h4>
        </div>
        {data.uptimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.uptimeData}>
              <XAxis dataKey="date" tick={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
              <Tooltip formatter={(v: number) => `${v}%`} labelFormatter={(l) => String(l).slice(0, 10)} />
              <Line type="monotone" dataKey="uptime" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">Belum ada data uptime</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Progress per Kategori</h4>
        </div>
        {data.progressData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data.progressData.slice(0, 8)}>
              <XAxis dataKey="category" tick={{ fontSize: 8 }} interval={0} angle={-30} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10 }} width={25} />
              <Tooltip />
              <Bar dataKey="total" fill="#e2e8f0" name="Total" />
              <Bar dataKey="completed" fill="#22c55e" name="Selesai" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">Belum ada data progress</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold">Status Domain</h4>
        </div>
        {data.statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={data.statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                {data.statusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-muted-foreground py-8 text-center">Belum ada data status</p>
        )}
      </div>
    </div>
  )
}
