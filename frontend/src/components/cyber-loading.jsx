import { useEffect, useState } from "react";

export default function CyberLoadingScreen() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const particleEls = Array.from({ length: 20 }, (_, i) => {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = 2 + Math.random() * 3;
      const delay = Math.random() * 2;

      return (
        <div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-60 animate-[float_var(--dur)_ease-in-out_infinite]"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            //@ts-ignore
            "--dur": `${duration}s`,
            animationDelay: `${delay}s`,
          }}
        />
      );
    });
    setParticles(particleEls);
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-cyan-900/20 via-purple-900/20 to-pink-900/20">
          <div className="w-full h-full opacity-30 bg-[length:40px_40px] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] animate-gridMove" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse">
            CHALLENGE WAVE
          </h1>
          <div className="h-1 w-48 mx-auto mt-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse" />
        </div>

        {/* Loading Rings */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto relative">
            <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-full" />
            <div
              className="absolute inset-0 border-2 border-t-cyan-400 border-transparent rounded-full animate-spin"
              style={{ animationDuration: "1s" }}
            />
            <div
              className="absolute inset-2 border-2 border-r-purple-400 border-transparent rounded-full animate-spin reverse"
              style={{ animationDuration: "1.5s" }}
            />
            <div
              className="absolute inset-4 border-2 border-b-pink-400 border-transparent rounded-full animate-spin"
              style={{ animationDuration: "2s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-400 rounded-full animate-pulse shadow-lg shadow-cyan-400/50" />
            </div>
          </div>
        </div>

        {/* Typing Effect */}
        <div className="font-mono text-cyan-400 text-lg mb-4">
          <span className="inline-block animate-pulse">INITIALIZING...</span>
          <span className="animate-ping ml-1">_</span>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2 max-w-sm mx-auto">
          {[
            { label: "SYSTEMS", from: "cyan-400", to: "blue-500", percent: 85 },
            {
              label: "MATRIX",
              from: "purple-400",
              to: "pink-500",
              percent: 70,
            },
            { label: "UPLINK", from: "pink-400", to: "cyan-500", percent: 60 },
          ].map(({ label, from, to, percent }) => (
            <div
              key={label}
              className="flex items-center space-x-3 text-xs font-mono text-cyan-300"
            >
              <span className="w-24">{label}:</span>
              <div className="flex-1 h-1 bg-gray-800 rounded overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r from-${from} to-${to} rounded animate-[progressLoad_2s_ease-in-out_infinite_alternate]`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none">{particles}</div>

      {/* Corners */}
      <div className="absolute top-4 left-4">
        <div className="w-8 h-8 border-l-2 border-t-2 border-cyan-400 animate-pulse" />
      </div>
      <div className="absolute top-4 right-4">
        <div className="w-8 h-8 border-r-2 border-t-2 border-purple-400 animate-pulse" />
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="w-8 h-8 border-l-2 border-b-2 border-pink-400 animate-pulse" />
      </div>
      <div className="absolute bottom-4 right-4">
        <div className="w-8 h-8 border-r-2 border-b-2 border-cyan-400 animate-pulse" />
      </div>
    </div>
  );
}
