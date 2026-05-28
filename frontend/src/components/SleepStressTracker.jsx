import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function SleepStressTracker() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [sleepHours, setSleepHours] = useState(7)
  const [stressLevel, setStressLevel] = useState(5)
  const [history, setHistory] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/sleep-stress/log?days=7`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setHistory(data.entries || [])
    } catch (e) { console.error(e) }
  }

  const handleSave = async () => {
    setSaving(true)
    const token = localStorage.getItem('token')
    try {
      await fetch(`${API_BASE}/api/sleep-stress/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date, sleep_hours: sleepHours, stress_level: stressLevel })
      })
      fetchHistory()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const sleepEmoji = sleepHours >= 8 ? '😴' : sleepHours >= 6 ? '😐' : '😵'
  const stressColor = stressLevel <= 3 ? 'text-green-400' : stressLevel <= 6 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">😴 Sleep & Stress</h3>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Sleep: {sleepHours}h {sleepEmoji}</span>
          </div>
          <input 
            type="range" min="0" max="12" step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            className="w-full accent-indigo-400"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>0h</span><span>12h</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Stress: <span className={stressColor}>{stressLevel}/10</span></span>
          </div>
          <input 
            type="range" min="1" max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="w-full accent-red-400"
          />
          <div className="flex justify-between text-xs text-gray-600">
            <span>Calm</span><span>Stressed</span>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Log Today'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Last 7 Days</p>
          <div className="flex gap-1">
            {history.map((entry, i) => (
              <div key={i} className="flex-1 text-center">
                <div 
                  className="mx-auto w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                  style={{ 
                    backgroundColor: entry.stress_level <= 3 ? '#22c55e20' : entry.stress_level <= 6 ? '#eab30820' : '#ef444420',
                    color: entry.stress_level <= 3 ? '#22c55e' : entry.stress_level <= 6 ? '#eab308' : '#ef4444'
                  }}
                >
                  {entry.stress_level}
                </div>
                <p className="text-[10px] text-gray-500">
                  {new Date(entry.date).toLocaleDateString('en', { weekday: 'narrow' })}
                </p>
                <p className="text-[10px] text-indigo-400">{entry.sleep_hours}h</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
