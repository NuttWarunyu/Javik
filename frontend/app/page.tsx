'use client'

import VideoCreator from '../components/VideoCreator'

export default function Home() {
  return (
    <main className="min-h-screen pb-20 bg-gradient-to-b from-[#050508] via-[#0a0a0f] to-[#050508] relative overflow-hidden">
      {/* Matrix Rain Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-[#00ff41] text-xs font-mono whitespace-nowrap"
            style={{
              left: `${(i * 5) % 100}%`,
              animationDelay: `${i * 0.5}s`,
              animation: 'matrix-rain 20s linear infinite',
            }}
          >
            {Array.from({ length: 30 }).map((_, j) => (
              <div key={j} className="opacity-50" style={{ animationDelay: `${j * 0.1}s` }}>
                {String.fromCharCode(0x30A0 + Math.random() * 96)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Grid Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 65, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 65, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}></div>
      </div>

      {/* Animated Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#00ffff] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block p-5 mb-6 relative">
            <div className="absolute inset-0 bg-[#00ff41] rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative bg-[#0a0a0f] border-2 border-[#00ff41] rounded-full p-4 neon-border">
              <span className="text-5xl block animate-pulse-neon">🤖</span>
            </div>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold mb-4 neon-glow text-[#00ff41] font-mono tracking-wider">
            JAVIK
          </h1>
          <div className="relative inline-block">
            <p className="text-[#00ffff] text-lg sm:text-xl font-mono mb-2 relative z-10">
              &gt; AI VIDEO GENERATOR
            </p>
            <div className="absolute inset-0 bg-[#00ffff] opacity-20 blur-md"></div>
          </div>
          <p className="text-[#00ff41] text-sm mt-3 font-mono opacity-80">
            [SYSTEM] Ready to generate...
          </p>
        </div>
        
        {/* Main Card */}
        <div className="bg-[#0a0a0f]/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 sm:p-8 border-2 border-[#00ff41]/30 neon-border relative overflow-hidden">
          {/* Scanline effect */}
          <div className="absolute inset-0 pointer-events-none opacity-5" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.1) 2px, rgba(0, 255, 65, 0.1) 4px)',
          }}></div>
          
          <VideoCreator />
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-[#0a0a0f]/80 backdrop-blur-sm rounded-lg border border-[#00ff41]/30 neon-border">
            <span className="text-[#00ff41] font-mono text-xs">[STATUS]</span>
            <p className="text-[#00ffff] text-xs font-mono">
              Generating high-quality videos...
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes matrix-rain {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }
        
        @keyframes twinkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse-neon {
          0%, 100% {
            opacity: 1;
            text-shadow: 0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 15px #00ff41;
          }
          50% {
            opacity: 0.8;
            text-shadow: 0 0 2px #00ff41, 0 0 5px #00ff41, 0 0 8px #00ff41;
          }
        }
      `}</style>
    </main>
  )
}

