'use client'

import VideoCreator from '@/components/VideoCreator'

export default function Home() {
  return (
    <main className="min-h-screen pb-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-4xl">🎬</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Javik
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            สร้างคลิปสั้นอัตโนมัติด้วย AI
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <VideoCreator />
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            💡 เพียงพิมพ์หัวข้อ AI จะสร้างวิดีโอให้คุณอัตโนมัติ
          </p>
        </div>
      </div>
    </main>
  )
}

