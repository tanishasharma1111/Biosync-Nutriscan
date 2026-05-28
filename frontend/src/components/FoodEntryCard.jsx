import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function FoodEntryCard({ entry, onDelete }) {
  const { token } = useAuth()

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/food/log/${entry.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) onDelete(entry.id)
    } catch {}
  }

  const mealColors = {
    breakfast: 'bg-amber-500/20 text-amber-400',
    lunch: 'bg-emerald-500/20 text-emerald-400',
    dinner: 'bg-blue-500/20 text-blue-400',
    snack: 'bg-purple-500/20 text-purple-400'
  }

  return (
    <div className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${mealColors[entry.meal_type] || 'bg-gray-600/20 text-gray-400'}`}>
            {entry.meal_type}
          </span>
        </div>
        <p className="text-white text-sm font-medium truncate">{entry.food_name}</p>
        <p className="text-gray-400 text-xs mt-1">
          {Math.round(entry.calories)} kcal
          <span className="mx-1">·</span>
          P: {Math.round(entry.protein)}g
          <span className="mx-1">·</span>
          F: {Math.round(entry.fat)}g
          <span className="mx-1">·</span>
          C: {Math.round(entry.carbs)}g
        </p>
      </div>
      <button
        onClick={handleDelete}
        className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/20 ml-3"
      >
        Remove
      </button>
    </div>
  )
}
