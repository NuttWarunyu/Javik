'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface ImageInfo {
  url: string
  thumbnail: string
  source: string
  license: string
}

interface ImageSelectorProps {
  topic: string
  keywords: string[]
  imageVarietyKeywords?: string[]
  onSelect: (selectedImageUrls: string[]) => void
  onCancel: () => void
  minImages?: number
  maxImages?: number
}

export default function ImageSelector({ 
  topic, 
  keywords,
  imageVarietyKeywords = [],
  onSelect, 
  onCancel,
  minImages = 3,
  maxImages = 10
}: ImageSelectorProps) {
  const [images, setImages] = useState<ImageInfo[]>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003'

  useEffect(() => {
    searchImages()
  }, [topic, keywords])

  const searchImages = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await axios.post(`${apiUrl}/api/video/search-images`, {
        topic,
        keywords,
        imageVarietyKeywords,
        maxImages: 20, // Search for 20 images, user selects from them
      })

      if (response.data.success) {
        setImages(response.data.images || [])
      } else {
        setError(response.data.error || 'ไม่พบรูปภาพ')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'เกิดข้อผิดพลาดในการค้นหารูปภาพ')
      console.error('Error searching images:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleImage = (url: string) => {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      if (newSelected.size < maxImages) {
        newSelected.add(url)
      }
    }
    setSelectedUrls(newSelected)
  }

  const handleConfirm = () => {
    if (selectedUrls.size < minImages) {
      setError(`กรุณาเลือกรูปภาพอย่างน้อย ${minImages} รูป`)
      return
    }
    onSelect(Array.from(selectedUrls))
  }

  return (
    <div className="fixed inset-0 bg-[#050508]/95 backdrop-blur-lg z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0a0a0f] border-2 border-[#00ff41]/50 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0f] border-b-2 border-[#00ff41]/30 p-5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#00ff41] font-mono uppercase tracking-wider">
              [SELECT_IMAGES]
            </h2>
            <p className="text-sm text-[#00ffff]/70 mt-1 font-mono">
              Topic: {topic} | Selected: {selectedUrls.size}/{maxImages} | Min: {minImages}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[#ff0000] hover:text-[#ff4444] text-2xl font-mono"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading && (
            <div className="text-center py-10">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-[#00ff41] border-t-transparent rounded-full"></div>
              <p className="text-[#00ffff] font-mono mt-4">[SEARCHING] Finding images...</p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-[#1a0000]/80 border-2 border-red-500/50 text-red-400 px-4 py-3 rounded-lg font-mono text-sm mb-4">
              [ERROR] {error}
            </div>
          )}

          {!loading && images.length === 0 && !error && (
            <div className="text-center py-10">
              <p className="text-[#00ffff] font-mono">[INFO] No images found. Try different keywords.</p>
            </div>
          )}

          {!loading && images.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-5">
                {images.map((image, index) => {
                  const isSelected = selectedUrls.has(image.url)
                  return (
                    <div
                      key={index}
                      onClick={() => toggleImage(image.url)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-[#00ff41] shadow-[0_0_20px_rgba(0,255,65,0.5)]'
                          : 'border-[#00ffff]/30 hover:border-[#00ffff]'
                      }`}
                    >
                      <img
                        src={image.thumbnail || image.url}
                        alt={`Image ${index + 1}`}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#00ff41] text-[#050508] rounded-full w-8 h-8 flex items-center justify-center font-bold">
                          ✓
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-[#050508]/90 p-2 text-xs">
                        <div className="text-[#00ff41] font-mono">{image.source}</div>
                        <div className="text-[#00ffff]/70 text-[10px]">{image.license}</div>
                      </div>
                      <div className="absolute inset-0 bg-[#00ff41]/0 group-hover:bg-[#00ff41]/10 transition-all"></div>
                    </div>
                  )
                })}
              </div>

              {selectedUrls.size < minImages && (
                <div className="bg-[#ffff00]/20 border-2 border-[#ffff00]/50 text-[#ffff00] px-4 py-3 rounded-lg font-mono text-sm mb-4">
                  [WARNING] กรุณาเลือกรูปภาพอย่างน้อย {minImages} รูป (เลือกแล้ว {selectedUrls.size} รูป)
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0a0a0f] border-t-2 border-[#00ff41]/30 p-5 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-[#ff0000]/20 border-2 border-[#ff0000]/50 text-[#ff0000] px-4 py-3 rounded-lg font-mono uppercase tracking-wider hover:bg-[#ff0000]/30 transition-all"
          >
            [CANCEL]
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedUrls.size < minImages}
            className="flex-1 bg-gradient-to-r from-[#00ff41] to-[#00ffff] text-[#050508] px-4 py-3 rounded-lg font-bold font-mono uppercase tracking-wider hover:from-[#00ff88] hover:to-[#00ffff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            [CONFIRM] ({selectedUrls.size} selected)
          </button>
        </div>
      </div>
    </div>
  )
}

