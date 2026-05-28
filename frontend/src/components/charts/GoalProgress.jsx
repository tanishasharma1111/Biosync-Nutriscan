import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'

function GoalProgress({ history }) {
  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('nutriscan_goals')
    return saved ? JSON.parse(saved) : { calories: 2000, protein: 50, fat: 65, carbs: 300 }
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const todayScans = history.filter(scan => {
    const scanDate = new Date(scan.created_at)
    return scanDate >= today && scanDate < tomorrow
  })

  const consumed = {
    calories: todayScans.reduce((sum, s) => sum + s.nutrition.calories, 0),
    protein: todayScans.reduce((sum, s) => sum + s.nutrition.protein, 0),
    fat: todayScans.reduce((sum, s) => sum + s.nutrition.fat, 0),
    carbs: todayScans.reduce((sum, s) => sum + s.nutrition.carbs, 0)
  }

  const percentage = (value, goal) => Math.min((value / goal) * 100, 100)

  const handleGoalChange = (macro, value) => {
    const newGoals = { ...goals, [macro]: value }
    setGoals(newGoals)
    localStorage.setItem('nutriscan_goals', JSON.stringify(newGoals))
  }

  const macros = [
    { key: 'calories', label: 'Calories', unit: 'kcal', color: '#f97316', icon: '🔥' },
    { key: 'protein', label: 'Protein', unit: 'g', color: '#3b82f6', icon: '💪' },
    { key: 'fat', label: 'Fat', unit: 'g', color: '#eab308', icon: '🥑' },
    { key: 'carbs', label: 'Carbs', unit: 'g', color: '#8b5cf6', icon: '🍞' }
  ]

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Today's Goals</h3>
      <div className="grid grid-cols-2 gap-4">
        {macros.map(macro => {
          const pct = percentage(consumed[macro.key], goals[macro.key])
          return (
            <div key={macro.key} className="bg-gray-900/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{macro.icon}</span>
                  <span className="text-gray-400 text-sm">{macro.label}</span>
                </div>
                <button
                  onClick={() => {
                    const newVal = prompt(`Set ${macro.label} goal:`, goals[macro.key])
                    if (newVal && !isNaN(newVal)) handleGoalChange(macro.key, parseInt(newVal))
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Edit
                </button>
              </div>
              <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: macro.color }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">{Math.round(consumed[macro.key])} / {goals[macro.key]} {macro.unit}</span>
                <span style={{ color: macro.color }}>{Math.round(pct)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GoalProgress