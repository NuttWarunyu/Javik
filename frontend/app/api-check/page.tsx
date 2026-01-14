'use client'

import ApiChecker from '../../components/ApiChecker'

export default function ApiCheckPage() {
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

      <div className="container mx-auto px-4 py-8 sm:py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 neon-glow text-[#00ff41] font-mono tracking-wider">
            API STATUS
          </h1>
          <p className="text-[#00ffff] text-sm font-mono opacity-80">
            [SYSTEM] Checking API connections...
          </p>
        </div>
        
        <ApiChecker />
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
      `}</style>
    </main>
  )
}

