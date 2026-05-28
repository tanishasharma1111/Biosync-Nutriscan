import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import SkinConcernBadge from '../components/SkinConcernBadge'
import ProductRecommendationPanel from '../components/ProductRecommendationPanel'
import SkinScoreChart from '../components/SkinScoreChart'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function SkinSyncPage() {
  const { user } = useAuth()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [acneScore, setAcneScore] = useState(3)
  const [glowScore, setGlowScore] = useState(5)
  const [correlation, setCorrelation] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [skincareBarcode, setSkincareBarcode] = useState('')
  const [skincareIngredients, setSkincareIngredients] = useState('')
  const [skincareResult, setSkincareResult] = useState(null)

  useEffect(() => {
    fetchHistory()
    fetchCorrelation()
  }, [])

  const fetchHistory = async () => {
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/skin/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setScans(data)
    } catch (err) { console.error(err) }
  }

  const fetchCorrelation = async () => {
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/skin/correlation`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await resp.json()
      setCorrelation(data.correlation)
    } catch (err) { console.error(err) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('image', selectedFile)
    formData.append('acne_score', acneScore)
    formData.append('glow_score', glowScore)

    try {
      const resp = await fetch(`${API_BASE}/api/skin/scan`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      if (resp.ok) {
        fetchHistory()
        fetchCorrelation()
        setSelectedFile(null)
      }
    } catch (err) { console.error(err) }
    finally { setUploading(false) }
  }

  const analyzeSkincare = async () => {
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/api/skincare/analyze`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: "User Product",
          ingredients: skincareIngredients
        })
      })
      const data = await resp.json()
      setSkincareResult(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-emerald-400 hover:text-emerald-300">← Back</Link>
            <h1 className="text-3xl font-bold">SkinSync AI</h1>
          </div>
          <div className="bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/30">
            <span className="text-emerald-400 font-medium">✨ Skin Vitality Mode active</span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Skin Analysis */}
          <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              📸 New Skin Scan
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {selectedFile ? (
                  <span className="text-emerald-400">{selectedFile.name}</span>
                ) : (
                  <p className="text-gray-400">Click to upload or take a skin photo</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Acne Severity (1-10)</label>
                <input 
                  type="range" min="0" max="10" 
                  value={acneScore} 
                  onChange={(e) => setAcneScore(e.target.value)}
                  className="w-full accent-emerald-400"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Clear</span><span>Severe</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Skin Glow (1-10)</label>
                <input 
                  type="range" min="0" max="10" 
                  value={glowScore} 
                  onChange={(e) => setGlowScore(e.target.value)}
                  className="w-full accent-teal-400"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Dull</span><span>Radiant</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 rounded-xl font-bold transition-colors"
              >
                {uploading ? 'Analyzing...' : 'Analyze Skin'}
              </button>
            </form>
          </section>

          {/* Right: Insights & Ingredients */}
          <div className="space-y-8">
            <section className="bg-emerald-900/20 border border-emerald-500/30 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-3 text-emerald-400 flex items-center gap-2">
                🤖 AI Skin Analysis
              </h2>
              {scans[0]?.skin_concern && (
                <div className="mb-4">
                  <SkinConcernBadge 
                    concern={scans[0].skin_concern} 
                    confidence={scans[0].confidence} 
                  />
                </div>
              )}
              <p className="text-gray-300 italic leading-relaxed">
                "{scans[0]?.insight || correlation || 'Analyzing your recent meals and skin health patterns...'}"
              </p>
            </section>

            <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-4">🧴 Ingredient Analyzer</h2>
              <div className="space-y-4">
                <textarea 
                  placeholder="Paste product ingredients here..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-sm h-24 focus:border-emerald-400 outline-none"
                  value={skincareIngredients}
                  onChange={(e) => setSkincareIngredients(e.target.value)}
                />
                <button 
                  onClick={analyzeSkincare}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                >
                  Check for Clogging Ingredients
                </button>

                {skincareResult && (
                  <div className={`p-4 rounded-xl border ${skincareResult.is_safe ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <p className="font-bold mb-1">
                      {skincareResult.is_safe ? '✅ Seems safe for acne-prone skin!' : '⚠️ Warning Found'}
                    </p>
                    {skincareResult.concerns && (
                      <p className="text-sm text-gray-400">Concerns: {skincareResult.concerns}</p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* New: Advanced AI Confidence Breakdown */}
        {scans.length > 0 && scans[0].analysis_data && (scans[0].analysis_data.metrics || scans[0].analysis_data.scores) && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
              <SkinScoreChart analysisData={scans[0].analysis_data} />
              
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-emerald-400 mb-4">Dermatology-Grade AI</h3>
                <p className="text-gray-300 leading-relaxed text-lg italic">
                  "Our Vision AI extracts features like texture, pigmentation, and redness across 8 specific categories to give you a definitive second opinion on your skin health."
                </p>
                <div className="mt-8 flex gap-4">
                  <div className="flex-1 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Visual Depth</div>
                    <div className="text-xl font-bold text-gray-100 italic">4K Pixel Mapping</div>
                  </div>
                  <div className="flex-1 bg-gray-900/50 p-4 rounded-2xl border border-gray-700/50">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Processing</div>
                    <div className="text-xl font-bold text-gray-100 italic">Vision-LLM</div>
                  </div>
                </div>
              </div>
           </div>
        )}

        {/* New: Smart AI Recommendations Section */}
        {scans.length > 0 && scans[0].recommendations && (
           <ProductRecommendationPanel recommendations={scans[0].recommendations} />
        )}

        {/* History Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Skin History</h2>
            <p className="text-sm text-gray-500">{scans.length} scans logged</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {scans.map(scan => (
              <div key={scan.id} className="bg-gray-800/80 backdrop-blur-md border border-gray-700 rounded-2xl p-5 space-y-4 hover:border-emerald-400/50 transition-all group">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-medium">{new Date(scan.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <div className="flex gap-2">
                    <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg text-xs font-bold ring-1 ring-emerald-500/20">A: {scan.acne_score}</span>
                    <span className="bg-teal-500/10 text-teal-400 px-2 py-1 rounded-lg text-xs font-bold ring-1 ring-teal-500/20">G: {scan.glow_score}</span>
                  </div>
                </div>
                <div className="h-32 bg-gray-900 rounded-xl overflow-hidden relative">
                   {scan.image_path ? (
                     <img src={`${API_BASE}/${scan.image_path}`} alt="Skin Scan" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-gray-700">No Image</div>
                   )}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  "{scan.insight || 'Scan processed successfully.'}"
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default SkinSyncPage
