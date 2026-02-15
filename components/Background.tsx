import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-950">
      {/* Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/30 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/30 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[40%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-cyan-900/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      {/* Floating Elements (Anti-gravity particles) */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-neon rounded-full animate-float opacity-50"></div>
      <div className="absolute top-3/4 left-1/3 w-3 h-3 bg-neonPurple rounded-full animate-float opacity-30" style={{ animationDuration: '8s', animationDelay: '1s' }}></div>
      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-white rounded-full animate-float opacity-70" style={{ animationDuration: '4s', animationDelay: '2s' }}></div>
    </div>
  );
};

export default Background;
