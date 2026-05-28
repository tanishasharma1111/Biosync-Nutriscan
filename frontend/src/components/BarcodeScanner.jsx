import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function BarcodeScanner({ onScanned, onClose }) {
  const { token } = useAuth()
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const barcodes = []

  // We'll use a simple manual entry fallback since barcode scanning libs need installation
  const [manualBarcode, setManualBarcode] = useState('')

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) return
    setScanning(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/barcode/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ barcode: manualBarcode.trim() })
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.food)
        onScanned(data.food)
      }
    } catch (e) {
      setError('Failed to lookup barcode')
    }
    setScanning(false)
  }

  if (!scanning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Scan Barcode</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">&times;</button>
          </div>

          <p className="text-gray-400 text-sm mb-4">Enter barcode number manually (camera scanning requires additional setup)</p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value)}
              placeholder="Barcode number (e.g. 5000169014529)"
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
            />
            <button
              onClick={handleManualLookup}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Lookup
            </button>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {result && (
            <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
              <p className="text-white font-medium text-sm">{result.description}</p>
              <p className="text-gray-400 text-xs mt-1">{result.brand}</p>
              <p className="text-gray-300 text-sm mt-2">
                {Math.round(result.calories)} kcal | P: {Math.round(result.protein)}g | F: {Math.round(result.fat)}g | C: {Math.round(result.carbs)}g
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
