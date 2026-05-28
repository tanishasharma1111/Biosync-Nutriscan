import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function FoodSearchModal({ isOpen, onClose, onLogged, defaultMealType }) {
  const { token } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [mealType, setMealType] = useState(defaultMealType || 'breakfast')
  const [servings, setServings] = useState(1)
  const [servingSize, setServingSize] = useState('')
  const [logging, setLogging] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const debounceRef = useRef(null)

  useEffect(() => { setMealType(defaultMealType || 'breakfast') }, [defaultMealType])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/food/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setResults(data.foods || [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, token])

  const handleSelect = (food) => {
    setSelectedFood(food)
    setServings(1)
    setServingSize(food.serving_size || `${food.serving_size} ${food.serving_unit}`.trim())
  }

  const handleLog = async () => {
    if (!selectedFood) return
    setLogging(true)
    try {
      const entry = {
        date,
        meal_type: mealType,
        food_name: selectedFood.description,
        brand: selectedFood.brand || '',
        calories: selectedFood.calories * servings,
        protein: selectedFood.protein * servings,
        fat: selectedFood.fat * servings,
        carbs: selectedFood.carbs * servings,
        serving_size: servingSize,
        servings
      }
      const res = await fetch(`${API_BASE}/api/food/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(entry)
      })
      if (res.ok) {
        const data = await res.json()
        onLogged(data.entry)
        setSelectedFood(null)
        setQuery('')
        onClose()
      }
    } catch {}
    setLogging(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Log Food</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Date & Meal Type */}
          <div className="flex gap-3">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            />
            <select
              value={mealType}
              onChange={e => setMealType(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              {MEAL_TYPES.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
            </select>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search foods (e.g. apple, chicken breast)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400"
          />

          {/* Results */}
          {loading && <div className="text-center py-4 text-gray-400">Searching...</div>}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-4 text-gray-500">No results found</div>
          )}
          {!loading && results.length > 0 && !selectedFood && (
            <div className="space-y-2">
              {results.map((food, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(food)}
                  className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 cursor-pointer hover:border-emerald-400/50 transition-colors"
                >
                  <p className="text-white text-sm font-medium leading-snug">{food.description}</p>
                  {food.brand && <p className="text-gray-400 text-xs mt-1">{food.brand}</p>}
                  <p className="text-gray-400 text-xs mt-1">
                    {Math.round(food.calories)} kcal | P: {Math.round(food.protein)}g | F: {Math.round(food.fat)}g | C: {Math.round(food.carbs)}g
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Selected Food Form */}
          {selectedFood && (
            <div className="space-y-3 bg-gray-700/30 border border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium text-sm">{selectedFood.description}</p>
                  {selectedFood.brand && <p className="text-gray-400 text-xs">{selectedFood.brand}</p>}
                </div>
                <button onClick={() => setSelectedFood(null)} className="text-gray-400 hover:text-white text-sm">Change</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-400 text-xs">Servings</label>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={servings}
                    onChange={e => setServings(parseFloat(e.target.value) || 1)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs">Serving size</label>
                  <input
                    type="text"
                    value={servingSize}
                    onChange={e => setServingSize(e.target.value)}
                    placeholder="e.g. 1 cup"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1 text-xs text-gray-400">
                <span>Cal: {Math.round(selectedFood.calories * servings)}</span>
                <span>P: {Math.round(selectedFood.protein * servings)}g</span>
                <span>F: {Math.round(selectedFood.fat * servings)}g</span>
                <span>C: {Math.round(selectedFood.carbs * servings)}g</span>
              </div>
            </div>
          )}
        </div>

        {selectedFood && (
          <div className="p-5 border-t border-gray-700">
            <button
              onClick={handleLog}
              disabled={logging}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {logging ? 'Logging...' : 'Log Food'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
