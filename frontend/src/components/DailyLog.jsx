import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import FoodEntryCard from './FoodEntryCard'
import FoodSearchModal from './FoodSearchModal'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function DailyLog() {
  const { token } = useAuth()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [entries, setEntries] = useState([])
  const [goals, setGoals] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeMeal, setActiveMeal] = useState('breakfast')

  useEffect(() => {
    fetchEntries()
    fetchGoals()
  }, [date, token])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/food/log?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setEntries(data.entries || [])
    } catch {} finally { setLoading(false) }
  }

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      setGoals(data.goals)
    } catch {}
  }

  const handleDelete = (id) => setEntries(prev => prev.filter(e => e.id !== id))

  const handleLogged = (entry) => setEntries(prev => [...prev, entry])

  const totals = entries.reduce((acc, e) => ({
    calories: acc.calories + e.calories,
    protein: acc.protein + e.protein,
    fat: acc.fat + e.fat,
    carbs: acc.carbs + e.carbs
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 })

  const grouped = MEAL_TYPES.reduce((acc, meal) => {
    acc[meal] = entries.filter(e => e.meal_type === meal)
    return acc
  }, {})

  const changeDate = (days) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  const caloriePct = goals ? Math.round((totals.calories / goals.daily_calories) * 100) : 0
  const isOver = goals && totals.calories > goals.daily_calories

  return (
    <div className="space-y-4">
      {/* Date Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">&#8592;</button>
        <div className="text-center">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white">&#8594;</button>
      </div>

      {/* Calorie Summary */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Today's Calories</span>
          <span className={`text-sm font-medium ${isOver ? 'text-red-400' : 'text-emerald-400'}`}>
            {Math.round(totals.calories)} / {goals?.daily_calories || '—'} kcal ({caloriePct}%)
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(caloriePct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <span>P: {Math.round(totals.protein)}g{goals ? ` / ${goals.protein}g` : ''}</span>
          <span>F: {Math.round(totals.fat)}g{goals ? ` / ${goals.fat}g` : ''}</span>
          <span>C: {Math.round(totals.carbs)}g{goals ? ` / ${goals.carbs}g` : ''}</span>
        </div>
      </div>

      {/* Meal Sections */}
      <div className="space-y-3">
        {MEAL_TYPES.map(meal => (
          <div key={meal}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300 capitalize">{meal}</h3>
              <button
                onClick={() => { setActiveMeal(meal); setShowModal(true) }}
                className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
              >
                + Add
              </button>
            </div>
            <div className="space-y-2">
              {grouped[meal].length === 0 && (
                <p className="text-gray-600 text-xs text-center py-2">No items logged</p>
              )}
              {grouped[meal].map(entry => (
                <FoodEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <FoodSearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onLogged={handleLogged}
        defaultMealType={activeMeal}
      />
    </div>
  )
}
