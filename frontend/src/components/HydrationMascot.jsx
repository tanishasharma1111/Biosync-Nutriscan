import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const QUICK_AMOUNTS = [250, 500, 750, 1000]

// Mascot states based on hydration percentage
const getMascotState = (pct) => {
  if (pct >= 100) return { emoji: '🌿', face: '🤩', bg: 'from-emerald-500/30 to-teal-500/30', border: 'border-emerald-400/50', message: "FULLY HYDRATED! Your skin is glowing! ✨", pulse: true }
  if (pct >= 75) return  { emoji: '🌱', face: '😊', bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-400/40', message: "Almost there! Keep drinking!", pulse: false }
  if (pct >= 50) return  { emoji: '🪴', face: '😐', bg: 'from-yellow-500/15 to-green-500/15', border: 'border-yellow-400/30', message: "Halfway — your skin needs more water", pulse: false }
  if (pct >= 25) return  { emoji: '🥀', face: '😟', bg: 'from-orange-500/15 to-yellow-500/15', border: 'border-orange-400/30', message: "Dehydrated! Drink up soon...", pulse: false }
  return                 { emoji: '🏜️', face: '😵', bg: 'from-red-500/15 to-orange-500/15', border: 'border-red-400/30', message: "SOS! Your skin is parched!", pulse: false }
}

export default function HydrationMascot() {
  const { token } = useAuth()
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [totalMl, setTotalMl] = useState(0)
  const [goalMl, setGoalMl] = useState(2000)
  const [loading, setLoading] = useState(false)
  const [animateAdd, setAnimateAdd] = useState(false)

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
    setAnimateAdd(true)
    setTimeout(() => setAnimateAdd(false), 600)
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
  const mascot = getMascotState(pct)

  return (
    <div className={`bg-gradient-to-br ${mascot.bg} border ${mascot.border} rounded-2xl p-5 transition-all duration-700`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2">💧 Hydration</h3>
        <span className="text-sm text-gray-400">{totalMl} / {goalMl} ml</span>
      </div>

      {/* Mascot */}
      <div className="flex items-center justify-center py-4">
        <div className={`relative transition-transform duration-300 ${animateAdd ? 'scale-125' : 'scale-100'}`}>
          <span className={`text-5xl block ${mascot.pulse ? 'animate-bounce' : ''}`}>
            {mascot.emoji}
          </span>
          <span className="absolute -top-1 -right-3 text-2xl">{mascot.face}</span>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mb-3 italic">{mascot.message}</p>

      {/* Circular progress */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#374151"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeDasharray={`${pct}, 100`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-blue-400">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map(ml => (
          <button
            key={ml}
            onClick={() => logWater(ml)}
            disabled={loading}
            className="py-2 text-xs font-medium bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all hover:scale-105 disabled:opacity-50"
          >
            +{ml}ml
          </button>
        ))}
      </div>
    </div>
  )
}
