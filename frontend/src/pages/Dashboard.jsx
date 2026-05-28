import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import UploadCard from '../components/UploadCard'
import NutritionDashboard from '../components/NutritionDashboard'
import InsightPanel from '../components/InsightPanel'
import NutritionChart from '../components/charts/NutritionChart'
import WeeklyStats from '../components/charts/WeeklyStats'
import HealthScoreTrend from '../components/charts/HealthScoreTrend'
import GoalProgress from '../components/charts/GoalProgress'
import DailyLog from '../components/DailyLog'
import HydrationMascot from '../components/HydrationMascot'
import WeightTracker from '../components/WeightTracker'
import SleepStressTracker from '../components/SleepStressTracker'
import SupplementTracker from '../components/SupplementTracker'
import BarcodeSkinScanner from '../components/BarcodeSkinScanner'
import ProgressTimeline from '../components/ProgressTimeline'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [currentScan, setCurrentScan] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async (token) => {
    try {
      const response = await fetch(`${API_BASE}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setHistory(data)
    } catch (err) {
      console.error('Error fetching history:', err)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) fetchHistory(token)
  }, [])

  const handleUpload = async (imageFile) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('Please log in to scan food')
      return
    }

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      setCurrentScan(data)
      setHistory(prev => [data, ...prev])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (scanId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${API_BASE}/scan/${scanId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Delete failed')

      setHistory(prev => prev.filter(s => s.id !== scanId))
      if (currentScan?.id === scanId) {
        setCurrentScan(null)
      }
    } catch (err) {
      console.error('Error deleting scan:', err)
    }
  }

  const handleSelectScan = (scan) => {
    setCurrentScan(scan)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
      <header className="bg-gray-800/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                NutriScan AI
              </h1>
              <p className="text-gray-400 text-sm">Welcome, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-yellow-400 text-sm font-medium transition-colors"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Food Logging */}
            <div className="bg-gray-800/50 dark:bg-gray-800/50 border border-gray-700 dark:border-gray-700 rounded-2xl p-5">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">Daily Food Log</h2>
              <DailyLog />
            </div>

            {/* Image Scanner */}
            <div className="mb-4">
              <UploadCard onUpload={handleUpload} loading={loading} />
            </div>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                {error}
              </div>
            )}

            {currentScan && (
              <div className="space-y-6 animate-fade-in">
                <NutritionDashboard scan={currentScan} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <NutritionChart nutrition={currentScan.nutrition} />
                  <GoalProgress history={history} />
                </div>
                <InsightPanel insight={currentScan.insight} />
              </div>
            )}

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <WeeklyStats />
              <HealthScoreTrend />
            </div>

            {/* Progress Timeline */}
            <div className="mt-6">
              <ProgressTimeline />
            </div>

            {history.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-semibold text-gray-300 mb-4">Scan History</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((scan) => (
                    <div
                      key={scan.id}
                      onClick={() => handleSelectScan(scan)}
                      className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-emerald-400/50 hover:bg-gray-800/70 ${
                        currentScan?.id === scan.id ? 'border-emerald-400' : 'border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg capitalize">{scan.food_name}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(scan.id)
                            }}
                            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              scan.health_score >= 70
                                ? 'bg-green-500/20 text-green-400'
                                : scan.health_score >= 40
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {scan.health_score}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5 space-y-4">
              <h2 className="text-lg font-semibold text-emerald-400">Wellness Ecosystem</h2>
              <div className="grid grid-cols-1 gap-3">
                <Link 
                  to="/skinsync" 
                  className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-emerald-500/20 rounded-xl transition-all border border-gray-600 hover:border-emerald-500/50 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✨</span>
                    <div className="text-left">
                      <p className="font-medium">SkinSync AI</p>
                      <p className="text-xs text-gray-400">Acne & Glow Tracker</p>
                    </div>
                  </div>
                  <span className="text-gray-500 group-hover:text-emerald-400">→</span>
                </Link>
                <Link 
                  to="/grocery-list" 
                  className="flex items-center justify-between p-3 bg-gray-700/50 hover:bg-teal-500/20 rounded-xl transition-all border border-gray-600 hover:border-teal-500/50 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🛒</span>
                    <div className="text-left">
                      <p className="font-medium">Smart Grocery</p>
                      <p className="text-xs text-gray-400">Skin-Friendly Shopping</p>
                    </div>
                  </div>
                  <span className="text-gray-500 group-hover:text-teal-400">→</span>
                </Link>
              </div>
            </div>
            
            <HydrationMascot />
            <SleepStressTracker />
            <SupplementTracker />
            <BarcodeSkinScanner />
            <WeightTracker />
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-800 text-center text-gray-500 text-sm">
        Powered by Clarifai, USDA & Ollama
      </footer>
    </div>
  )
}

export default Dashboard
