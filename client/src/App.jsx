import { useState, useRef } from 'react'
import FeedbackCard from './components/FeedbackCard'

function App() {
  const [audioUrl, setAudioUrl] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const audioRef = useRef(null)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setAudioUrl(URL.createObjectURL(file))
    setLoading(true)
    setFeedback([])
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Analysis failed')
      }
      
      const data = await res.json()
      setFeedback(data.feedback || [])
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const seekTo = (timestamp) => {
    const [min, sec] = timestamp.split(':').map(Number)
    const totalSec = min * 60 + sec
    if (audioRef.current) {
      audioRef.current.currentTime = totalSec
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-zinc-900 mb-3 tracking-tight">
            Audio Analyzer
          </h1>
          <p className="text-zinc-600 text-lg">Upload classroom audio to get AI-powered pedagogical insights</p>
        </div>

        <div className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-8 mb-8 hover:shadow-md transition-shadow">
          <label className="block">
            <div className="mb-4">
              <div className="text-sm font-medium text-zinc-700 mb-2">Audio File</div>
              <div className="text-xs text-zinc-500">Supported formats: MP3, WAV</div>
            </div>
            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFile}
                className="block w-full text-sm text-zinc-700
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-zinc-900 file:text-white
                  hover:file:bg-zinc-800 
                  file:cursor-pointer file:transition-all
                  cursor-pointer border-2 border-dashed border-zinc-300 
                  rounded-lg p-4 hover:border-zinc-400 transition-colors"
              />
            </div>
          </label>
        </div>

        {audioUrl && (
          <div className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-8 mb-8">
            <div className="text-sm font-medium text-zinc-700 mb-4">Audio Player</div>
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full"
            />
          </div>
        )}

        {loading && (
          <div className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-12 mb-8">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4"></div>
              <div className="text-zinc-900 font-medium text-lg">Analyzing audio</div>
              <div className="text-zinc-500 text-sm mt-1">This may take a moment...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <div className="text-red-600 font-bold text-xl">×</div>
              <div>
                <div className="font-semibold text-red-900 mb-1">Error</div>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {feedback.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 mb-2">Pedagogical Insights</h2>
              <p className="text-zinc-600">Click on timestamps to jump to specific moments</p>
            </div>
            <div className="space-y-4">
              {feedback.map((item, idx) => (
                <FeedbackCard
                  key={idx}
                  timestamp={item.timestamp}
                  principle={item.principle}
                  description={item.description}
                  onSeek={seekTo}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 mt-16 border-t border-zinc-200">
        <div className="flex flex-col items-center justify-center gap-3">
          <a
            href="https://github.com/SaiAryan1784"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors group"
            aria-label="GitHub Profile"
          >
            <svg
              className="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="text-sm font-medium">SaiAryan1784</span>
          </a>
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Sai Aryan Goswami. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

