'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

interface ScriptData {
  script: string
  hashtags: string[]
  keywords?: string[]
  captions: Array<{
    text: string
    startTime: number
    duration: number
  }>
}

interface EditModeProps {
  videoUrl: string
  videoPath: string
  scriptData: ScriptData
  jobId: string
  onClose: () => void
  onRegenerate: (newVideoUrl: string) => void
}

export default function EditMode({ videoUrl, videoPath, scriptData: initialScriptData, jobId, onClose, onRegenerate }: EditModeProps) {
  const [scriptData, setScriptData] = useState<ScriptData>(initialScriptData)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'script' | 'images' | 'audio'>('script')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError('ไม่อนุญาตให้เข้าถึงไมโครโฟน')
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioBlob(file)
      const url = URL.createObjectURL(file)
      setAudioUrl(url)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadedImages(prev => [...prev, ...files])
  }

  const handleRegenerate = async () => {
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('jobId', jobId)
      formData.append('videoPath', videoPath)
      formData.append('script', scriptData.script)
      formData.append('hashtags', JSON.stringify(scriptData.hashtags))
      formData.append('keywords', JSON.stringify(scriptData.keywords))
      formData.append('captions', JSON.stringify(scriptData.captions))

      // Add audio if uploaded
      if (audioBlob) {
        formData.append('audio', audioBlob, 'audio.webm')
      }

      // Add images if uploaded
      uploadedImages.forEach((image, index) => {
        formData.append('images', image)
      })

      const response = await axios.post(`${apiUrl}/api/video/regenerate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.video) {
        onRegenerate(response.data.video.url)
        onClose()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาด')
      console.error('Error regenerating video:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#050508]/95 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0a0a0f] border-2 border-[#00ff41]/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0f] border-b-2 border-[#00ff41]/30 p-5 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-[#00ff41] font-mono uppercase tracking-wider">
            [EDIT_MODE]
          </h2>
          <button
            onClick={onClose}
            className="text-[#ff0000] hover:text-[#ff4444] text-2xl font-mono"
          >
            ✕
          </button>
        </div>

        {/* Video Preview */}
        <div className="p-5 border-b-2 border-[#00ffff]/30">
          <div className="bg-[#050508] rounded-lg overflow-hidden border-2 border-[#00ffff]/30">
            <video
              src={videoUrl}
              controls
              className="w-full h-auto"
              style={{ maxHeight: '400px' }}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[#00ffff]/30">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 px-5 py-3 font-mono uppercase tracking-wider transition-all ${
              activeTab === 'script'
                ? 'bg-[#00ff41]/20 text-[#00ff41] border-b-2 border-[#00ff41]'
                : 'text-[#00ffff]/50 hover:text-[#00ffff]'
            }`}
          >
            [SCRIPT]
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 px-5 py-3 font-mono uppercase tracking-wider transition-all ${
              activeTab === 'images'
                ? 'bg-[#00ff41]/20 text-[#00ff41] border-b-2 border-[#00ff41]'
                : 'text-[#00ffff]/50 hover:text-[#00ffff]'
            }`}
          >
            [IMAGES]
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 px-5 py-3 font-mono uppercase tracking-wider transition-all ${
              activeTab === 'audio'
                ? 'bg-[#00ff41]/20 text-[#00ff41] border-b-2 border-[#00ff41]'
                : 'text-[#00ffff]/50 hover:text-[#00ffff]'
            }`}
          >
            [AUDIO]
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Script Tab */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[#00ffff] font-mono uppercase tracking-wider mb-2">
                  [SCRIPT_TEXT]
                </label>
                <textarea
                  value={scriptData.script}
                  onChange={(e) => setScriptData({ ...scriptData, script: e.target.value })}
                  className="w-full bg-[#050508] border-2 border-[#00ff41]/30 text-[#00ff41] p-4 rounded-lg font-mono text-sm min-h-[200px] focus:border-[#00ff41] focus:outline-none"
                  placeholder="แก้ไขสคริปต์..."
                />
              </div>
              <div>
                <label className="block text-[#00ffff] font-mono uppercase tracking-wider mb-2">
                  [HASHTAGS]
                </label>
                <input
                  type="text"
                  value={scriptData.hashtags.join(' ')}
                  onChange={(e) => setScriptData({ ...scriptData, hashtags: e.target.value.split(' ').filter(t => t) })}
                  className="w-full bg-[#050508] border-2 border-[#00ff41]/30 text-[#00ff41] p-3 rounded-lg font-mono focus:border-[#00ff41] focus:outline-none"
                  placeholder="#hashtag1 #hashtag2"
                />
              </div>
              <div>
                <label className="block text-[#00ffff] font-mono uppercase tracking-wider mb-2">
                  [KEYWORDS] (สำหรับค้นหารูปภาพ)
                </label>
                <input
                  type="text"
                  value={(scriptData.keywords || []).join(', ')}
                  onChange={(e) => setScriptData({ ...scriptData, keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) })}
                  className="w-full bg-[#050508] border-2 border-[#00ff41]/30 text-[#00ff41] p-3 rounded-lg font-mono focus:border-[#00ff41] focus:outline-none"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[#00ffff] font-mono uppercase tracking-wider mb-2">
                  [UPLOAD_IMAGES]
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full bg-[#00ff41]/20 border-2 border-[#00ff41]/50 text-[#00ff41] px-4 py-3 rounded-lg font-mono uppercase tracking-wider hover:bg-[#00ff41]/30 transition-all"
                >
                  [SELECT_IMAGES]
                </button>
              </div>
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-[#00ff41]/30"
                      />
                      <button
                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-[#ff0000] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[#00ffff] font-mono uppercase tracking-wider mb-2">
                  [RECORD_AUDIO]
                </label>
                <div className="flex gap-3">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex-1 bg-[#ff0000]/20 border-2 border-[#ff0000]/50 text-[#ff0000] px-4 py-3 rounded-lg font-mono uppercase tracking-wider hover:bg-[#ff0000]/30 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="w-3 h-3 bg-[#ff0000] rounded-full"></span>
                      [START_RECORDING]
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex-1 bg-[#ff0000] border-2 border-[#ff0000] text-white px-4 py-3 rounded-lg font-mono uppercase tracking-wider flex items-center justify-center gap-2 animate-pulse"
                    >
                      <span className="w-3 h-3 bg-white rounded-full"></span>
                      [STOP_RECORDING]
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[#00ffff] font-mono uppercase tracking-wider mb-2">
                  [UPLOAD_AUDIO_FILE]
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-[#00ffff]/20 border-2 border-[#00ffff]/50 text-[#00ffff] px-4 py-3 rounded-lg font-mono uppercase tracking-wider hover:bg-[#00ffff]/30 transition-all"
                >
                  [SELECT_AUDIO_FILE]
                </button>
              </div>
              {audioUrl && (
                <div className="bg-[#050508] border-2 border-[#00ff41]/30 rounded-lg p-4">
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-[#1a0000]/80 border-2 border-red-500/50 text-red-400 px-4 py-3 rounded-lg font-mono text-sm">
              [ERROR] {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-[#00ffff]/30">
            <button
              onClick={onClose}
              className="flex-1 bg-[#ff0000]/20 border-2 border-[#ff0000]/50 text-[#ff0000] px-4 py-3 rounded-lg font-mono uppercase tracking-wider hover:bg-[#ff0000]/30 transition-all"
            >
              [CANCEL]
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-[#00ff41] to-[#00ffff] text-[#050508] px-4 py-3 rounded-lg font-bold font-mono uppercase tracking-wider hover:from-[#00ff88] hover:to-[#00ffff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '[REGENERATING...]' : '[REGENERATE_VIDEO]'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

