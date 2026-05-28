import { useState, useRef } from 'react'

export default function VoiceLogger({ onTranscript }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)

    recognition.start()
  }

  if (!supported) return null

  return (
    <button
      onClick={startListening}
      disabled={listening}
      className={`p-2 rounded-lg transition-colors ${listening
        ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
        : 'bg-gray-700/50 text-gray-400 hover:text-white border border-gray-600'
      }`}
      title="Voice search"
    >
      🎤
    </button>
  )
}
