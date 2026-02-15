import React, { useState } from 'react';
import { AI_APPS } from '../constants';
import { FeatureType } from '../types';
import { Icons } from './Icons';

interface DashboardProps {
  onSelectFeature: (feature: FeatureType, initialPrompt?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectFeature }) => {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-neon to-neonPurple mb-4 animate-float">
          UI Chatbots Store
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Choose a specialized AI tool to supercharge your workflow. From coding to creativity, it's all here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {AI_APPS.map((app) => {
          const Icon = (Icons as any)[app.icon] || Icons.Cpu;
          return (
            <div 
              key={app.id}
              onClick={() => onSelectFeature(app.featureId as FeatureType, app.prompt)}
              className="group relative bg-slate-900/40 border border-white/5 rounded-2xl p-5 cursor-pointer overflow-hidden transition-all duration-300 hover:border-neon/50 hover:shadow-[0_0_20px_rgba(0,243,255,0.1)] hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10 flex flex-col items-start h-full">
                <div className="p-3 rounded-xl bg-slate-800/50 mb-3 text-neon group-hover:scale-110 transition-transform duration-300 border border-white/5">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-neon transition-colors">{app.name}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">
                  {app.description}
                </p>
                <div className="flex items-center text-xs text-slate-500 font-medium bg-black/30 px-2 py-1 rounded border border-white/5">
                    {app.featureId === 'CHAT' ? 'TEXT MODEL' : app.featureId.replace('_', ' ')}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats / Mock Data Visualization */}
      <div className="mt-16 border-t border-white/10 pt-8">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Icons.LayoutDashboard className="w-5 h-5 text-neon" /> System Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-neon/20">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Compute Load</div>
                <div className="text-2xl font-mono text-neon">Optimized</div>
                <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
                    <div className="bg-neon h-full w-[45%] animate-pulse"></div>
                </div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-purple-500/20">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Active Models</div>
                <div className="text-2xl font-mono text-neonPurple">Gemini 3 Pro</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-green-500/20">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Services</div>
                <div className="text-2xl font-mono text-green-400 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> All Operational
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};