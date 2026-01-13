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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="topic" className="block text-sm font-semibold text-gray-800 mb-2">
            หัวข้อวิดีโอ
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="เช่น: สอนปลูกต้นไม้"
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-semibold text-gray-800 mb-2">
            ความยาววิดีโอ (วินาที)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={15}
            max={60}
            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">แนะนำ: 15-60 วินาที</p>
        </div>

        <button
          type="submit"
          disabled={loading || !topic}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 px-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {progress || 'กำลังสร้างวิดีโอ...'}
            </span>
          ) : (
            '🎬 สร้างวิดีโอ'
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm">
          <p className="font-semibold flex items-center gap-2">
            <span>❌</span> เกิดข้อผิดพลาด
          </p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      )}

      {loading && progress && (
        <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-4 py-3 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="font-medium">{progress}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-700 px-4 py-4 rounded-xl shadow-sm">
            <p className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span>✅</span> สร้างวิดีโอสำเร็จ!
            </p>
            <button
              onClick={downloadVideo}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              📥 ดาวน์โหลดวิดีโอ
            </button>
          </div>

          {scriptData && (
            <div className="space-y-4 bg-white p-5 rounded-xl border-2 border-gray-200 shadow-sm">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-base">📝 สคริปต์:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-lg">{scriptData.script}</p>
              </div>

              {scriptData.hashtags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-base">🏷️ Hashtags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {scriptData.hashtags.map((tag, index) => (
                      <span key={index} className="text-sm bg-gradient-to-r from-primary-100 to-primary-50 text-primary-700 px-3 py-1.5 rounded-lg font-medium border border-primary-200">
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

