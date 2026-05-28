import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import FoodSearchModal from '../components/FoodSearchModal'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealPlanPage() {
  const { token } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCell, setSelectedCell] = useState(null)

  useEffect(() => { fetchPlans() }, [token])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/meal-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPlans(data.plans || [])
    } catch {}
    setLoading(false)
  }

  const handleCellClick = (day, meal) => {
    setSelectedCell({ day, meal })
    setShowModal(true)
  }

  const handleFoodLogged = (entry) => {
    // Add to food log
    fetch(`${API_BASE}/api/food/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(entry)
    })
  }

  const getFoodForCell = (dayIdx, meal) => {
    return plans.find(p => p.day_of_week === dayIdx && p.meal_type === meal)
  }

  const copyDayToLog = async (dayIdx) => {
    const dayPlans = plans.filter(p => p.day_of_week === dayIdx)
    const today = new Date()
    today.setDate(today.getDate() - today.getDay() + 1 + dayIdx)
    const dateStr = today.toISOString().split('T')[0]

    for (const plan of dayPlans) {
      await fetch(`${API_BASE}/api/food/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: dateStr,
          meal_type: plan.meal_type,
          food_name: plan.food_name,
          calories: plan.calories,
          protein: plan.protein,
          fat: plan.fat,
          carbs: plan.carbs,
          servings: plan.servings
        })
      })
    }
    alert(`${DAYS[dayIdx]} meals copied to today!`)
  }

  const gridPlans = DAYS.map((day, dayIdx) => (
    <div key={day} className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white">{day}</h3>
        <button
          onClick={() => copyDayToLog(dayIdx)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
        >
          Copy to Today
        </button>
      </div>
      <div className="space-y-2">
        {MEALS.map(meal => {
          const food = getFoodForCell(dayIdx, meal)
          return (
            <div key={meal}>
              <p className="text-gray-500 text-xs capitalize mb-1">{meal}</p>
              {food ? (
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <p className="text-white text-xs font-medium leading-tight">{food.food_name}</p>
                  <p className="text-gray-400 text-xs">{Math.round(food.calories)} kcal</p>
                </div>
              ) : (
                <button
                  onClick={() => handleCellClick(dayIdx, meal)}
                  className="w-full border border-dashed border-gray-600 rounded-lg p-2 text-gray-500 text-xs hover:border-emerald-400/50 hover:text-emerald-400 transition-colors"
                >
                  + Add food
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  ))

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Meal Planner
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {gridPlans}
        </div>
      </main>

      {selectedCell && (
        <FoodSearchModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onLogged={(entry) => {
            const mealType = selectedCell.meal
            // Save to meal plan
            fetch(`${API_BASE}/api/meal-plans`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                day_of_week: selectedCell.day,
                meal_type: mealType,
                food_name: entry.food_name,
                calories: entry.calories,
                protein: entry.protein,
                fat: entry.fat,
                carbs: entry.carbs,
                servings: entry.servings
              })
            }).then(() => { fetchPlans(); setShowModal(false) })
          }}
          defaultMealType={selectedCell.meal}
        />
      )}
    </div>
  )
}
