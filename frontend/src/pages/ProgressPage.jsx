import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import WeeklyStats from '../components/charts/WeeklyStats'
import HealthScoreTrend from '../components/charts/HealthScoreTrend'
import WeightTracker from '../components/WeightTracker'
import WaterTracker from '../components/WaterTracker'
import NutritionChart from '../components/charts/NutritionChart'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ProgressPage() {
  const { token } = useAuth()
  const [history, setHistory] = useState([])
  const [weeklyNutrition, setWeeklyNutrition] = useState(null)

  useEffect(() => { fetchHistory() }, [token])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setHistory(data)
    } catch {}
  }

  const totals = history.reduce((acc, s) => ({
    calories: acc.calories + s.nutrition.calories,
    protein: acc.protein + s.nutrition.protein,
    fat: acc.fat + s.nutrition.fat,
    carbs: acc.carbs + s.nutrition.carbs
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Progress
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Total Scans</p>
            <p className="text-3xl font-bold text-emerald-400">{history.length}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Avg Calories</p>
            <p className="text-3xl font-bold text-blue-400">
              {history.length ? Math.round(totals.calories / history.length) : 0}
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Avg Protein</p>
            <p className="text-3xl font-bold text-purple-400">
              {history.length ? Math.round(totals.protein / history.length) : 0}g
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyStats history={history} />
          <HealthScoreTrend history={history} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeightTracker />
          <WaterTracker />
        </div>
      </main>
    </div>
  )
}
