'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface VideoResult {
  url: string
  filename: string
}

interface ScriptData {
  script: string
  hashtags: string[]
  captions: Array<{
    text: string
    startTime: number
    duration: number
  }>
}

type JobStatus = 'idle' | 'creating' | 'processing' | 'completed' | 'error'

export default function VideoCreator() {
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState(60)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<VideoResult | null>(null)
  const [scriptData, setScriptData] = useState<ScriptData | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus>('idle')
  const [progress, setProgress] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

  // Poll job status
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'error') return

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/video/status/${jobId}`)
        const { status, progress: jobProgress, video, script, hashtags, captions, error: jobError } = response.data

        setProgress(jobProgress || '')

        if (status === 'completed' && video) {
          setJobStatus('completed')
          setResult(video)
          setScriptData({
            script: script || '',
            hashtags: hashtags || [],
            captions: captions || [],
          })
          setLoading(false)
        } else if (status === 'error') {
          setJobStatus('error')
          setError(jobError || 'เกิดข้อผิดพลาดในการสร้างวิดีโอ')
          setLoading(false)
        } else if (status === 'processing') {
          setJobStatus('processing')
        }
      } catch (err: any) {
        console.error('Error checking status:', err)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [jobId, jobStatus, apiUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    setScriptData(null)
    setJobStatus('creating')
    setProgress('')

    try {
      const response = await axios.post(`${apiUrl}/api/video/create`, {
        topic,
        duration,
      })

      // Check if response is async (has jobId) or sync (has video)
      if (response.data.jobId) {
        setJobId(response.data.jobId)
        setJobStatus('processing')
        setProgress('กำลังสร้างสคริปต์...')
      } else if (response.data.video) {
        // Synchronous response (for quick jobs)
        setResult(response.data.video)
        setScriptData({
          script: response.data.script,
          hashtags: response.data.hashtags,
          captions: response.data.captions,
        })
        setJobStatus('completed')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาด')
      setJobStatus('error')
      setLoading(false)
      console.error('Error:', err)
    }
  }

  const downloadVideo = () => {
    if (result) {
      const downloadUrl = `${apiUrl}${result.url}`
      window.open(downloadUrl, '_blank')
    }
  }

  return (
    <div className="space-y-6 relative z-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-mono font-bold text-[#00ff41] mb-3 uppercase tracking-wider">
            &gt; INPUT_TOPIC
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="[ENTER TOPIC] เช่น: สอนปลูกต้นไม้"
            className="w-full px-5 py-4 border-2 border-[#00ff41]/50 rounded-lg focus:ring-2 focus:ring-[#00ff41] focus:border-[#00ff41] transition-all text-base bg-[#050508] text-[#00ff41] font-mono placeholder:text-[#00ff41]/40 neon-border focus:neon-border hover:border-[#00ff41]"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-mono font-bold text-[#00ff41] mb-3 uppercase tracking-wider">
            &gt; DURATION_SECONDS
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={15}
            max={60}
            className="w-full px-5 py-4 border-2 border-[#00ff41]/50 rounded-lg focus:ring-2 focus:ring-[#00ff41] focus:border-[#00ff41] transition-all text-base bg-[#050508] text-[#00ff41] font-mono neon-border focus:neon-border hover:border-[#00ff41]"
            disabled={loading}
          />
          <p className="text-xs text-[#00ffff] mt-3 font-mono opacity-70">[INFO] Recommended: 15-60 seconds</p>
        </div>

        <button
          type="submit"
          disabled={loading || !topic}
          className="w-full bg-gradient-to-r from-[#00ff41] to-[#00ffff] text-[#050508] py-5 px-6 rounded-lg font-bold text-lg font-mono uppercase tracking-wider hover:from-[#00ff88] hover:to-[#00ffff] disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:shadow-[0_0_30px_rgba(0,255,65,0.8)] active:scale-[0.98] transform hover:scale-[1.02] relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
          {loading ? (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-mono">{progress || '[PROCESSING] Generating video...'}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3 relative z-10">
              <span className="text-xl">▶</span>
              <span>[EXECUTE] GENERATE VIDEO</span>
            </span>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-[#1a0000]/80 border-2 border-red-500/50 text-red-400 px-5 py-4 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.3)] font-mono">
          <p className="font-bold flex items-center gap-2 text-red-400 uppercase tracking-wider">
            <span className="text-[#ff0000]">[ERROR]</span> SYSTEM_FAILURE
          </p>
          <p className="text-sm mt-3 text-red-300/80 font-mono">{error}</p>
        </div>
      )}

      {loading && progress && (
        <div className="bg-[#001a1a]/80 border-2 border-[#00ffff]/50 text-[#00ffff] px-5 py-4 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.3)] font-mono">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-[#00ffff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-mono text-sm uppercase tracking-wider">[STATUS] {progress}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-[#001a00]/80 border-2 border-[#00ff41]/50 text-[#00ff41] px-5 py-5 rounded-lg shadow-[0_0_30px_rgba(0,255,65,0.4)] font-mono">
            <p className="font-bold text-lg mb-4 flex items-center gap-3 uppercase tracking-wider">
              <span className="text-[#00ff41] animate-pulse">[SUCCESS]</span>
              <span>VIDEO_GENERATED</span>
            </p>
            <button
              onClick={downloadVideo}
              className="w-full bg-gradient-to-r from-[#00ff41] to-[#00ffff] text-[#050508] px-6 py-4 rounded-lg font-bold text-lg font-mono uppercase tracking-wider hover:from-[#00ff88] hover:to-[#00ffff] transition-all shadow-[0_0_20px_rgba(0,255,65,0.5)] hover:shadow-[0_0_30px_rgba(0,255,65,0.8)] active:scale-[0.98] transform hover:scale-[1.02] relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
              <span className="flex items-center justify-center gap-3 relative z-10">
                <span className="text-xl">⬇</span>
                <span>[DOWNLOAD] VIDEO_FILE</span>
              </span>
            </button>
          </div>

          {scriptData && (
            <div className="space-y-5 bg-[#0a0a0f]/80 p-5 rounded-lg border-2 border-[#00ffff]/30 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
              <div>
                <h3 className="font-bold text-[#00ffff] mb-3 text-sm font-mono uppercase tracking-wider">[SCRIPT_DATA]</h3>
                <div className="bg-[#050508] border border-[#00ff41]/30 rounded p-4 font-mono text-sm text-[#00ff41] leading-relaxed whitespace-pre-wrap">
                  {scriptData.script}
                </div>
              </div>

              {scriptData.hashtags.length > 0 && (
                <div>
                  <h3 className="font-bold text-[#00ffff] mb-3 text-sm font-mono uppercase tracking-wider">[HASHTAGS]</h3>
                  <div className="flex flex-wrap gap-2">
                    {scriptData.hashtags.map((tag, index) => (
                      <span key={index} className="text-xs bg-[#00ff41]/10 border border-[#00ff41]/50 text-[#00ff41] px-3 py-2 rounded font-mono uppercase tracking-wider hover:bg-[#00ff41]/20 transition-all">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

