import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function WeeklyStats() {
  const [data, setData] = useState([])
  const [avgCalories, setAvgCalories] = useState(0)

  useEffect(() => {
    const fetchWeeklyData = async () => {
      const token = localStorage.getItem('token')
      try {
        // Fetch food log entries for the last 7 days
        const today = new Date()
        const weekAgo = new Date()
        weekAgo.setDate(today.getDate() - 6)

        // Build day buckets
        const days = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date()
          d.setDate(today.getDate() - i)
          days.push({
            dateObj: d,
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            dateStr: d.toISOString().split('T')[0],
            calories: 0
          })
        }

        // Fetch each day's log
        await Promise.all(days.map(async (dayObj) => {
          try {
            const resp = await fetch(`${API_BASE}/api/food/log?date=${dayObj.dateStr}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (resp.ok) {
              const data = await resp.json()
              const entries = data.entries || []
              dayObj.calories = entries.reduce((sum, e) => sum + (e.calories || 0), 0)
            }
          } catch (_) {}
        }))

        const activeDays = days.filter(d => d.calories > 0)
        const avg = activeDays.length > 0
          ? Math.round(activeDays.reduce((s, d) => s + d.calories, 0) / activeDays.length)
          : 0

        setData(days)
        setAvgCalories(avg)
      } catch (err) {
        console.error('WeeklyStats error:', err)
      }
    }

    fetchWeeklyData()
  }, [])

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Weekly Calories</h3>
        <div className="text-right">
          <p className="text-sm text-gray-400">Daily Average</p>
          <p className="text-xl font-bold text-emerald-400">{avgCalories} kcal</p>
        </div>
      </div>
      <div className="h-48">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Log meals to see your weekly calories here
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [`${Math.round(value)} kcal`, 'Calories']}
              />
              <Bar dataKey="calories" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default WeeklyStats