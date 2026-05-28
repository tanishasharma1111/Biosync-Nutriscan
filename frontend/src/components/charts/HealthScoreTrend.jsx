import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Score a single day's food log entries (0–100)
function scoreDayEntries(entries) {
  if (!entries || entries.length === 0) return null

  const totalCals = entries.reduce((s, e) => s + (e.calories || 0), 0)
  const totalProtein = entries.reduce((s, e) => s + (e.protein || 0), 0)
  const totalFat = entries.reduce((s, e) => s + (e.fat || 0), 0)
  const totalCarbs = entries.reduce((s, e) => s + (e.carbs || 0), 0)

  // Simple scoring model
  let score = 50

  // Protein: ideal 50-150g/day
  if (totalProtein >= 50 && totalProtein <= 150) score += 15
  else if (totalProtein > 0) score += 7

  // Calories: ideal 1500-2500
  if (totalCals >= 1500 && totalCals <= 2500) score += 15
  else if (totalCals > 0) score += 5

  // Fat ratio: ideal < 35% of calories
  const fatCals = totalFat * 9
  const fatRatio = totalCals > 0 ? fatCals / totalCals : 0
  if (fatRatio < 0.35) score += 10
  else if (fatRatio > 0.5) score -= 10

  // Carb ratio: ideal 45-65% of calories
  const carbCals = totalCarbs * 4
  const carbRatio = totalCals > 0 ? carbCals / totalCals : 0
  if (carbRatio >= 0.45 && carbRatio <= 0.65) score += 10

  // Meal variety bonus
  const mealTypes = new Set(entries.map(e => e.meal_type).filter(Boolean))
  if (mealTypes.size >= 3) score += 10
  else if (mealTypes.size >= 2) score += 5

  return Math.min(100, Math.max(0, Math.round(score)))
}

function HealthScoreTrend() {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      const days = []

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        days.push({
          dateStr: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })
      }

      const results = await Promise.all(days.map(async (day) => {
        try {
          const resp = await fetch(`${API_BASE}/api/food/log?date=${day.dateStr}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (resp.ok) {
            const data = await resp.json()
            const entries = data.entries || []
            const score = scoreDayEntries(entries)
            return { date: day.label, score }
          }
        } catch (_) {}
        return { date: day.label, score: null }
      }))

      // Only keep days with data
      const withData = results.filter(r => r.score !== null)
      setData(withData)
    }

    fetchData()
  }, [])

  if (data.length < 1) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">Health Score Trend</h3>
        <p className="text-gray-500 text-sm text-center py-8">
          Log meals for multiple days to see your health score trend
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Health Score Trend</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value}/100`, 'Health Score']}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#34d399"
              strokeWidth={3}
              dot={{ fill: '#34d399', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default HealthScoreTrend