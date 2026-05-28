import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const COMMON_SUPPLEMENTS = [
  { name: 'Zinc', dosage: '50mg', icon: '🔩' },
  { name: 'Omega-3', dosage: '1000mg', icon: '🐟' },
  { name: 'Vitamin D', dosage: '2000 IU', icon: '☀️' },
  { name: 'Probiotics', dosage: '10B CFU', icon: '🦠' },
  { name: 'Collagen', dosage: '5g', icon: '✨' },
  { name: 'Biotin', dosage: '5000mcg', icon: '💊' },
]

export default function SupplementTracker() {
  const [entries, setEntries] = useState([])
  const [customName, setCustomName] = useState('')
  const [customDosage, setCustomDosage] = useState('')

  useEffect(() => { fetchEntries() }, [])

  const fetchEntries = async () => {
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/supplements/log`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setEntries(data.entries || [])
    } catch (e) { console.error(e) }
  }

  const logSupplement = async (name, dosage) => {
    const token = localStorage.getItem('token')
    try {
      await fetch(`${API_BASE}/api/supplements/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, dosage, category: 'supplement' })
      })
      fetchEntries()
    } catch (e) { console.error(e) }
  }

  const deleteSupplement = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await fetch(`${API_BASE}/api/supplements/log/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchEntries()
    } catch (e) { console.error(e) }
  }

  const handleCustom = () => {
    if (customName.trim()) {
      logSupplement(customName.trim(), customDosage.trim())
      setCustomName('')
      setCustomDosage('')
    }
  }

  const alreadyLogged = entries.map(e => e.name.toLowerCase())

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">💊 Supplements</h3>

      {/* Quick-add pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {COMMON_SUPPLEMENTS.map(s => {
          const logged = alreadyLogged.includes(s.name.toLowerCase())
          return (
            <button
              key={s.name}
              onClick={() => !logged && logSupplement(s.name, s.dosage)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                logged
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default'
                  : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-purple-400'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
              {logged && <span>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Custom supplement input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Custom..."
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-purple-500 outline-none"
        />
        <input
          type="text"
          placeholder="Dose"
          value={customDosage}
          onChange={(e) => setCustomDosage(e.target.value)}
          className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-xs focus:border-purple-500 outline-none"
        />
        <button
          onClick={handleCustom}
          className="px-2 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs hover:bg-purple-500/30 transition-colors"
        >+</button>
      </div>

      {/* Today's log */}
      {entries.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Today's Log</p>
          {entries.map(e => (
            <div key={e.id} className="flex items-center justify-between py-1 px-2 bg-gray-900/50 rounded-lg">
              <span className="text-xs text-gray-300">{e.name} <span className="text-gray-600">{e.dosage}</span></span>
              <button onClick={() => deleteSupplement(e.id)} className="text-red-500/60 hover:text-red-400 text-xs">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
