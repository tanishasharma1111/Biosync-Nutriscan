import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function WeightTracker() {
  const { token } = useAuth()
  const [weight, setWeight] = useState('')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchWeightLog() }, [token])

  const fetchWeightLog = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/weight/log?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setEntries(data.entries || [])
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!weight) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/weight/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ weight_kg: parseFloat(weight) })
      })
      if (res.ok) {
        const data = await res.json()
        setEntries(prev => [...prev, data.entry].slice(-30))
        setWeight('')
      }
    } catch {}
    setLoading(false)
  }

  const chartData = [...entries]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(e => ({ date: e.date.slice(5), kg: e.weight_kg }))

  const latestWeight = entries.length ? entries[entries.length - 1].weight_kg : null

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-200 mb-4">Weight Tracker</h3>

      {/* Latest weight */}
      {latestWeight && (
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-emerald-400">{latestWeight}</span>
          <span className="text-gray-400 text-sm ml-1">kg</span>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={e => setWeight(e.target.value)}
          placeholder="Weight (kg)"
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Log
        </button>
      </form>

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="h-32 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis domain={['dataMin-1', 'dataMax+1']} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="kg" stroke="#34d399" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {chartData.length <= 1 && <p className="text-gray-600 text-xs text-center py-4">Log more weights to see trends</p>}
    </div>
  )
}
