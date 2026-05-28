import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function ProgressTimeline() {
  const [scans, setScans] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [compareIdx, setCompareIdx] = useState(null)

  useEffect(() => { fetchProgress() }, [])

  const fetchProgress = async () => {
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/skin/progress`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setScans(data || [])
      if (data.length >= 2) {
        setSelectedIdx(data.length - 1)
        setCompareIdx(0)
      } else if (data.length === 1) {
        setSelectedIdx(0)
      }
    } catch (e) { console.error(e) }
  }

  if (scans.length < 1) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">🕒 Progress Timeline</h3>
        <p className="text-gray-500 text-sm text-center py-6">Upload skin scans to track your progress over time</p>
      </div>
    )
  }

  const current = scans[selectedIdx]
  const compare = compareIdx !== null ? scans[compareIdx] : null
  const acneChange = compare ? current.acne_score - compare.acne_score : 0
  const glowChange = compare ? current.glow_score - compare.glow_score : 0

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/20 rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">🕒 Progress Timeline</h3>

      {/* Before & After Comparison */}
      {compare && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Before</p>
            <div className="bg-gray-900 rounded-xl p-3 border border-gray-700">
              {compare.image_path ? (
                <img src={`${API_BASE}/${compare.image_path}`} alt="Before" className="w-full h-28 object-cover rounded-lg opacity-80" />
              ) : (
                <div className="w-full h-28 bg-gray-800 rounded-lg flex items-center justify-center text-3xl">📷</div>
              )}
              <div className="mt-2 flex justify-center gap-2">
                <span className="bg-red-500/15 text-red-400 px-2 py-0.5 rounded text-xs font-bold">A:{compare.acne_score}</span>
                <span className="bg-teal-500/15 text-teal-400 px-2 py-0.5 rounded text-xs font-bold">G:{compare.glow_score}</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{new Date(compare.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Now</p>
            <div className="bg-gray-900 rounded-xl p-3 border border-emerald-500/30">
              {current.image_path ? (
                <img src={`${API_BASE}/${current.image_path}`} alt="After" className="w-full h-28 object-cover rounded-lg" />
              ) : (
                <div className="w-full h-28 bg-gray-800 rounded-lg flex items-center justify-center text-3xl">📸</div>
              )}
              <div className="mt-2 flex justify-center gap-2">
                <span className="bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded text-xs font-bold">A:{current.acne_score}</span>
                <span className="bg-teal-500/15 text-teal-400 px-2 py-0.5 rounded text-xs font-bold">G:{current.glow_score}</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{new Date(current.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Change Summary */}
      {compare && (
        <div className="flex justify-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Acne</p>
            <p className={`text-lg font-bold ${acneChange < 0 ? 'text-green-400' : acneChange > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {acneChange < 0 ? '↓' : acneChange > 0 ? '↑' : '—'} {Math.abs(acneChange)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Glow</p>
            <p className={`text-lg font-bold ${glowChange > 0 ? 'text-green-400' : glowChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {glowChange > 0 ? '↑' : glowChange < 0 ? '↓' : '—'} {Math.abs(glowChange)}
            </p>
          </div>
        </div>
      )}

      {/* Timeline Slider */}
      <div className="mt-2">
        <p className="text-xs text-gray-500 mb-2">Slide to compare scans ({scans.length} total)</p>
        <input
          type="range"
          min="0"
          max={scans.length - 1}
          value={selectedIdx}
          onChange={(e) => setSelectedIdx(parseInt(e.target.value))}
          className="w-full accent-purple-400"
        />
        <div className="flex justify-between text-[10px] text-gray-600 mt-1">
          <span>{new Date(scans[0].created_at).toLocaleDateString()}</span>
          <span>{new Date(scans[scans.length - 1].created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}
