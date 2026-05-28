import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const QUICK_AMOUNTS = [250, 500, 750, 1000]

export default function WaterTracker() {
  const { token } = useAuth()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [totalMl, setTotalMl] = useState(0)
  const [goalMl, setGoalMl] = useState(2000)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWater()
    fetchGoals()
  }, [date, token])

  const fetchWater = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/water/log?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTotalMl(data.total_ml || 0)
    } catch {}
  }

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.goals) setGoalMl(data.goals.water_ml)
    } catch {}
  }

  const logWater = async (amountMl) => {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/api/water/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date, amount_ml: amountMl })
      })
      setTotalMl(prev => prev + amountMl)
    } catch {}
    setLoading(false)
  }

  const pct = Math.min(Math.round((totalMl / goalMl) * 100), 100)
  const glasses = Math.floor(totalMl / 250)
  const glassGoal = Math.floor(goalMl / 250)

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-200">Water Intake</h3>
        <span className="text-sm text-gray-400">{totalMl} / {goalMl} ml</span>
      </div>

      {/* Glass visualization */}
      <div className="flex flex-wrap gap-1 mb-4">
        {Array.from({ length: glassGoal }, (_, i) => (
          <div
            key={i}
            className={`w-6 h-8 rounded-sm border ${i < glasses ? 'bg-blue-500 border-blue-400' : 'bg-gray-700 border-gray-600'}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map(ml => (
          <button
            key={ml}
            onClick={() => logWater(ml)}
            disabled={loading}
            className="py-2 text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            +{ml}ml
          </button>
        ))}
      </div>
    </div>
  )
}
