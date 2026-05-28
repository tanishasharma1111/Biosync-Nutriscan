import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function BarcodeSkinScanner() {
  const [barcode, setBarcode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScan = async () => {
    if (!barcode.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    const token = localStorage.getItem('token')
    try {
      const resp = await fetch(`${API_BASE}/api/barcode/skin-impact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ barcode: barcode.trim() })
      })
      const data = await resp.json()
      if (resp.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Product not found')
      }
    } catch (e) { setError('Scan failed') }
    setLoading(false)
  }

  const verdictColor = result?.skin_score >= 70 ? 'text-green-400 bg-green-500/10 border-green-500/30' 
    : result?.skin_score >= 40 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' 
    : 'text-red-400 bg-red-500/10 border-red-500/30'

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
      <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">📷 Food Barcode Scanner</h3>
      <p className="text-xs text-gray-500 mb-3">Scan packaged food to check its impact on your skin</p>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter barcode number..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:border-orange-400 outline-none"
        />
        <button
          onClick={handleScan}
          disabled={loading}
          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Scan'}
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-100">{result.product_name}</p>
              {result.brand && <p className="text-xs text-gray-500">{result.brand}</p>}
            </div>
            <div className={`px-3 py-1.5 rounded-xl border text-sm font-bold ${verdictColor}`}>
              {result.verdict}
            </div>
          </div>

          {/* Skin Score Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Skin Impact Score</span>
              <span className="font-bold">{result.skin_score}/100</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  result.skin_score >= 70 ? 'bg-green-500' : result.skin_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.skin_score}%` }}
              />
            </div>
          </div>

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="space-y-1.5">
              {result.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-red-500/5 border border-red-500/15 rounded-lg p-2">
                  <span className="text-red-400 mt-0.5">⚠️</span>
                  <span className="text-gray-300">{w}</span>
                </div>
              ))}
            </div>
          )}

          {result.warnings?.length === 0 && (
            <p className="text-green-400 text-xs bg-green-500/10 p-2 rounded-lg border border-green-500/20">
              ✅ No skin-negative ingredients detected! Safe to eat.
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] text-gray-600 mt-3">Try: 3017620422003 (Nutella), 5449000000439 (Coca-Cola)</p>
    </div>
  )
}
