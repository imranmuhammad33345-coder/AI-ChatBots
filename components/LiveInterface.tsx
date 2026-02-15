import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';
import { LiveClient, pcmToAudioBuffer } from '../services/geminiService';

export const LiveInterface: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const cleanupRef = useRef<(() => void) | null>(null);
  
  // Visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(0);

  const startSession = async () => {
    try {
        setStatus('connecting');
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outCtx;

        const client = new LiveClient();
        
        // Handle input volume for visualizer
        client.onInputVolume = (vol) => {
            volumeRef.current = vol;
        };
        
        // Handle output audio
        let nextStartTime = 0;
        client.onAudioData = (buffer) => {
             // Decode raw PCM manually
             const decoded = pcmToAudioBuffer(buffer, outCtx);
             const source = outCtx.createBufferSource();
             source.buffer = decoded;
             source.connect(outCtx.destination);
             const start = Math.max(outCtx.currentTime, nextStartTime);
             source.start(start);
             nextStartTime = start + decoded.duration;
        };

        const cleanup = await client.connect(audioCtx, outCtx);
        cleanupRef.current = cleanup;
        setStatus('connected');
        setIsActive(true);

    } catch (e) {
        console.error("Live failed", e);
        setStatus('disconnected');
        alert("Failed to connect to Live API. Check console.");
    }
  };

  const stopSession = () => {
    if (cleanupRef.current) cleanupRef.current();
    if (audioContextRef.current) audioContextRef.current.close();
    setIsActive(false);
    setStatus('disconnected');
    volumeRef.current = 0;
  };

  // Animation Loop
  useEffect(() => {
    if (!isActive) return;
    
    let animationFrameId: number;
    
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height / 2;
          
          ctx.clearRect(0, 0, width, height);
          
          const vol = volumeRef.current; // RMS volume (approx 0.0 - 0.5 usually)
          // Amplify for visual effect
          const amplifiedVol = Math.min(vol * 8, 1);
          
          // Draw base circle (always visible)
          ctx.beginPath();
          ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fill();
          
          // Dynamic Hue based on volume: Cyan (180) -> Purple (280) -> Red (360)
          const hue = 180 + (amplifiedVol * 180);
          const color = `hsla(${hue}, 100%, 50%, ${0.5 + amplifiedVol * 0.5})`;

          // Draw active ripples based on volume
          if (amplifiedVol > 0.02) {
              // Outer Ripple 1
              ctx.beginPath();
              ctx.arc(centerX, centerY, 60 + (amplifiedVol * 50), 0, 2 * Math.PI);
              ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${Math.max(0, 1 - amplifiedVol)})`;
              ctx.lineWidth = 2;
              ctx.stroke();

              // Outer Ripple 2 (delayed/smaller)
              ctx.beginPath();
              ctx.arc(centerX, centerY, 60 + (amplifiedVol * 30), 0, 2 * Math.PI);
              ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${Math.max(0, 0.8 - amplifiedVol)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
              
              // Inner Glow
              ctx.beginPath();
              ctx.arc(centerX, centerY, 58, 0, 2 * Math.PI);
              ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${amplifiedVol * 0.4})`;
              ctx.fill();
          } else {
             // Idle pulse
             const time = Date.now() / 1000;
             const pulse = Math.sin(time * 2) * 2;
             ctx.beginPath();
             ctx.arc(centerX, centerY, 60 + pulse, 0, 2 * Math.PI);
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
             ctx.lineWidth = 1;
             ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6">
       <div className="relative mb-8 group">
          <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-300 ${isActive ? 'opacity-40' : 'opacity-0'}`} style={{ backgroundColor: isActive ? `hsl(${180 + (volumeRef.current * 8 * 180)}, 100%, 50%)` : 'transparent' }}></div>
          <div className="relative w-48 h-48 rounded-full border border-white/10 bg-black/50 backdrop-blur-md flex items-center justify-center shadow-2xl overflow-hidden">
             <canvas ref={canvasRef} width="300" height="300" className="absolute inset-0 w-full h-full pointer-events-none"></canvas>
             <Icons.Mic className={`w-16 h-16 transition-colors duration-300 relative z-10 ${isActive ? 'text-white' : 'text-slate-500'}`} />
          </div>
       </div>

       <h2 className="text-2xl font-bold mb-2">Gemini Live</h2>
       <p className="text-slate-400 mb-8 text-center max-w-md">
         Real-time, low-latency voice conversation. Speak naturally to OmniMind.
       </p>

       <button
         onClick={isActive ? stopSession : startSession}
         className={`px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
             isActive 
             ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
             : 'bg-neon text-black hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]'
         }`}
       >
         {status === 'connecting' ? 'Connecting...' : isActive ? 'End Connection' : 'Start Conversation'}
       </button>
       
       <div className="mt-8 text-xs text-slate-600">
          Powered by Gemini 2.5 Native Audio
       </div>
    </div>
  );
};
