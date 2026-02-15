import React, { useState, useEffect, useRef } from 'react';
import { AppState } from '../types';
import { Icons } from './Icons';

interface WebDesignerProps {
  state: AppState;
  onSendMessage: (text: string, image?: File) => void;
}

export const WebDesigner: React.FC<WebDesignerProps> = ({ state, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [htmlCode, setHtmlCode] = useState<string>('');
  // 'split' shows both on large screens, 'preview'/'code' for mobile or toggle
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    const lastModelMsg = [...state.messages].reverse().find(m => m.role === 'model' && m.text.includes('```html'));
    if (lastModelMsg) {
        const match = lastModelMsg.text.match(/```html\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            setHtmlCode(match[1]);
        }
    }
  }, [state.messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
        {/* Header Toolbar */}
        <div className="bg-slate-900 border-b border-white/10 p-2 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-2 text-neon px-2">
                 <Icons.Layout className="w-5 h-5" />
                 <span className="font-bold hidden md:inline">Web Designer</span>
             </div>
             
             <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                  <button 
                     onClick={() => setViewMode('split')}
                     className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all hidden md:block ${viewMode === 'split' ? 'bg-neon text-black' : 'text-slate-400 hover:text-white'}`}
                  >
                      Split View
                  </button>
                  <button 
                     onClick={() => setViewMode('preview')}
                     className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-neon text-black' : 'text-slate-400 hover:text-white'}`}
                  >
                      Preview
                  </button>
                  <button 
                     onClick={() => setViewMode('code')}
                     className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'code' ? 'bg-neon text-black' : 'text-slate-400 hover:text-white'}`}
                  >
                      Code
                  </button>
              </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Chat Column (Always visible on left, resizeable conceptually but fixed for now) */}
            <div className="w-80 border-r border-white/10 bg-slate-900/50 flex flex-col shrink-0">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {state.messages.length === 0 && (
                        <div className="text-center text-slate-500 mt-10 text-sm">
                            <Icons.Layout className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>Describe a website to build it.</p>
                            <p className="text-xs mt-2 opacity-60">Try: "A dark mode landing page for a coffee shop"</p>
                        </div>
                    )}
                    {state.messages.map(msg => (
                        <div key={msg.id} className={`p-3 rounded-xl text-xs ${msg.role === 'user' ? 'bg-slate-800 ml-4 border border-white/5' : 'bg-white/5 mr-4'}`}>
                            {msg.role === 'user' ? msg.text : "Generated new version."}
                        </div>
                    ))}
                    {state.isThinking && <div className="text-xs text-neon animate-pulse px-4">Generating...</div>}
                </div>
                <div className="p-3 bg-black/40 border-t border-white/10">
                    <div className="relative">
                        <input 
                            className="w-full bg-slate-800 border border-white/10 rounded-full pl-4 pr-10 py-2.5 text-sm text-white focus:border-neon outline-none"
                            placeholder="Make the header blue..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                            onClick={handleSend}
                            className="absolute right-1 top-1 p-1.5 bg-neon text-black rounded-full hover:scale-105 transition-transform"
                        >
                            <Icons.Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex relative bg-slate-100">
                {/* Preview Pane */}
                <div className={`flex-1 relative flex flex-col ${(viewMode === 'code') ? 'hidden' : 'flex'}`}>
                     <div className="bg-white border-b border-slate-200 p-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                             <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                             <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                        </div>
                        <div className="bg-slate-100 text-slate-400 text-[10px] px-2 py-0.5 rounded-md flex-1 text-center mx-4 font-mono">
                            localhost:3000
                        </div>
                     </div>
                     {htmlCode ? (
                        <iframe 
                            srcDoc={htmlCode}
                            title="Preview"
                            className="flex-1 w-full h-full border-none bg-white"
                            sandbox="allow-scripts allow-modals allow-same-origin"
                        />
                     ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-300">
                            Preview Area
                        </div>
                     )}
                </div>

                {/* Code Pane */}
                <div className={`flex-1 bg-[#1e1e1e] flex flex-col border-l border-slate-700 overflow-hidden ${viewMode === 'split' ? 'hidden md:flex max-w-[50%]' : (viewMode === 'code' ? 'flex' : 'hidden')}`}>
                     <div className="bg-[#252526] p-2 text-xs text-slate-400 font-mono border-b border-black">
                         index.html
                     </div>
                     <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                         <pre className="text-xs font-mono text-[#d4d4d4] leading-relaxed">
                            {htmlCode || "// Code will appear here..."}
                         </pre>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};