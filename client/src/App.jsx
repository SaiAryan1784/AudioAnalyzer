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
      const res = await fetch('http://localhost:8000/analyze', {
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
    </div>
  )
}

export default App

