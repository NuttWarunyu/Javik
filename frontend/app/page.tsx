'use client'

import VideoCreator from '../components/VideoCreator'

export default function Home() {
  return (
    <main className="min-h-screen pb-20 bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-5xl block animate-bounce">🎬</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-3">
            Javik
          </h1>
          <p className="text-gray-700 text-base sm:text-lg font-medium">
            สร้างคลิปสั้นอัตโนมัติด้วย AI
          </p>
          <p className="text-gray-500 text-sm mt-2">
            เพียงพิมพ์หัวข้อ → AI สร้างวิดีโอให้คุณ
          </p>
        </div>
        
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
          <VideoCreator />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/50 shadow-sm">
            <span className="text-lg">✨</span>
            <p className="text-xs text-gray-600 font-medium">
              สร้างวิดีโอคุณภาพสูงในไม่กี่นาที
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  )
}

