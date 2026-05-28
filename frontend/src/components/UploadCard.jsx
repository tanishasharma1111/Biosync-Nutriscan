import { useState, useRef } from 'react'

function UploadCard({ onUpload, loading }) {
  const [preview, setPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleSubmit = async () => {
    if (selectedFile) {
      await onUpload(selectedFile)
    }
  }

  const handleClear = () => {
    setPreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-200">Upload Food Image</h2>

      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-emerald-400 bg-emerald-400/10'
              : 'border-gray-600 hover:border-emerald-400/50 hover:bg-gray-700/30'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-emerald-400/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">📷</span>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-300">Drop your image here</p>
              <p className="text-gray-500 text-sm mt-1">or click to browse</p>
            </div>
            <p className="text-gray-600 text-xs mt-2">Supports: PNG, JPG, JPEG, GIF, WebP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-contain bg-gray-900 rounded-xl"
            />
            <button
              onClick={handleClear}
              className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-emerald-400 hover:bg-emerald-500 disabled:bg-emerald-400/50 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🔍</span>
                <span>Analyze Food</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default UploadCard