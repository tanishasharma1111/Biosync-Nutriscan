import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function GroceryListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchList()
  }, [])

  const fetchList = async () => {
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/grocery/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setItems(data)
    } catch (err) { console.error(err) }
  }

  const generateList = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/grocery/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setItems(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const toggleItem = async (id) => {
    const token = localStorage.getItem('token')
    try {
      await fetch(`${API_BASE}/api/grocery/toggle/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      fetchList()
    } catch (err) { console.error(err) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-emerald-400 hover:text-emerald-300">← Back</Link>
            <h1 className="text-3xl font-bold">Smart Grocery List</h1>
          </div>
          <button 
            onClick={generateList}
            disabled={loading}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-bold transition-all transform hover:scale-105"
          >
            {loading ? 'AI Thinking...' : '🔄 Re-Generate for Skin Health'}
          </button>
        </header>

        <section className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-gray-700/50 border-b border-gray-700">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Nutrient Gaps identified by AI</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {items.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                Click Generate to create a list based on your recent diet.
              </div>
            ) : (
              items.map(item => (
                <div 
                  key={item.id} 
                  className={`flex items-center p-4 hover:bg-gray-700/30 transition-colors ${item.is_bought ? 'opacity-50' : ''}`}
                >
                  <input 
                    type="checkbox" 
                    checked={item.is_bought}
                    onChange={() => toggleItem(item.id)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-900 accent-emerald-500 cursor-pointer"
                  />
                  <div className="ml-4 flex-1">
                    <p className={`font-semibold ${item.is_bought ? 'line-through text-gray-400' : 'text-white'}`}>
                      {item.name}
                    </p>
                    <p className="text-xs text-emerald-400">{item.reason}</p>
                  </div>
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-400">
                    {item.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400 text-center">
           💡 Tip: Buying more {items.find(i => i.category === 'Produce')?.name || 'leafy greens'} this week will help with your skin cell turnover.
        </footer>
      </div>
    </div>
  )
}

export default GroceryListPage
