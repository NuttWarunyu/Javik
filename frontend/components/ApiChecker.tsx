'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface ApiStatus {
  status: 'working' | 'error' | 'not_configured'
  service: string
  message: string
  configured: boolean
  errorCode?: number
  details?: any
}

interface ApiCheckResult {
  timestamp: string
  apis: {
    openai?: ApiStatus
    elevenlabs?: ApiStatus
    openaiTTS?: ApiStatus
    googleTTS?: ApiStatus
    unsplash?: ApiStatus
    pexels?: ApiStatus
  }
  summary: {
    total: number
    working: number
    error: number
    notConfigured: number
  }
}

export default function ApiChecker() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ApiCheckResult | null>(null)
  const [error, setError] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

  const checkAll = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${apiUrl}/api/check/all`)
      setResult(response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to check APIs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAll()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'text-[#00ff41] border-[#00ff41]'
      case 'error':
        return 'text-[#ff0000] border-[#ff0000]'
      case 'not_configured':
        return 'text-[#ffff00] border-[#ffff00]'
      default:
        return 'text-[#00ffff] border-[#00ffff]'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return '[✓]'
      case 'error':
        return '[✗]'
      case 'not_configured':
        return '[!]'
      default:
        return '[?]'
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-[#050508] border-2 border-[#00ff41]/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-mono font-bold text-[#00ff41] uppercase tracking-wider">
            &gt; API_STATUS_CHECK
          </h2>
          <button
            onClick={checkAll}
            disabled={loading}
            className="px-6 py-3 bg-[#00ff41]/20 border-2 border-[#00ff41]/50 text-[#00ff41] font-mono uppercase tracking-wider rounded-lg hover:bg-[#00ff41]/30 hover:border-[#00ff41] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '[SCANNING...]' : '[REFRESH]'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#1a0000]/80 border-2 border-red-500/50 text-red-400 rounded-lg font-mono">
            <span className="text-red-500">[ERROR]</span> {error}
          </div>
        )}

        {result && (
          <>
            {/* Summary */}
            <div className="mb-6 p-4 bg-[#001a1a]/50 border border-[#00ffff]/30 rounded-lg font-mono text-sm">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-[#00ffff]">[TOTAL]</span>
                  <span className="text-[#00ff41] ml-2">{Object.keys(result.apis).length}</span>
                </div>
                <div>
                  <span className="text-[#00ffff]">[WORKING]</span>
                  <span className="text-[#00ff41] ml-2">{result.summary.working}</span>
                </div>
                <div>
                  <span className="text-[#00ffff]">[ERROR]</span>
                  <span className="text-[#ff0000] ml-2">{result.summary.error}</span>
                </div>
                <div>
                  <span className="text-[#00ffff]">[NOT_CONFIG]</span>
                  <span className="text-[#ffff00] ml-2">{result.summary.notConfigured}</span>
                </div>
              </div>
            </div>

            {/* API Status List */}
            <div className="space-y-3">
              {Object.entries(result.apis).map(([key, api]) => (
                <div
                  key={key}
                  className={`p-4 border-2 rounded-lg font-mono text-sm ${getStatusColor(api.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getStatusIcon(api.status)}</span>
                        <span className="font-bold uppercase">{api.service}</span>
                      </div>
                      <div className="text-xs opacity-80 ml-7">
                        {api.message}
                      </div>
                      {api.errorCode && (
                        <div className="text-xs opacity-60 ml-7 mt-1">
                          Error Code: {api.errorCode}
                        </div>
                      )}
                      {api.details && (
                        <div className="text-xs opacity-60 ml-7 mt-1 font-mono">
                          Details: {JSON.stringify(api.details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs opacity-50">
                      {api.configured ? '[CONFIGURED]' : '[NOT_CONFIGURED]'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-[#00ffff]/50 font-mono text-center">
              Last checked: {new Date(result.timestamp).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

