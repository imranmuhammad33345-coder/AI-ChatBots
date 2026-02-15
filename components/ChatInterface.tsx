import React, { useEffect, useRef, useState } from 'react';
import { Message, AppState, FeatureType } from '../types';
import { Icons } from './Icons';
import { speakText, pcmToAudioBuffer } from '../services/geminiService';

interface ChatInterfaceProps {
  state: AppState;
  onSendMessage: (text: string, file?: File) => void;
  onUpdateConfig: (key: string, value: any) => void;
  droppedFile?: File | null;
  clearDroppedFile?: () => void;
}

// Code Block Component with Copy Feature
const CodeBlock: React.FC<{ language: string, code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e] shadow-lg group">
       <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-black/50">
          <span className="text-xs text-slate-400 font-mono lowercase">{language || 'code'}</span>
          <button 
             onClick={handleCopy} 
             className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
             title="Copy Code"
          >
             {copied ? <Icons.Check className="w-3.5 h-3.5 text-green-400" /> : <Icons.Copy className="w-3.5 h-3.5" />}
             {copied ? <span className="text-green-400">Copied</span> : 'Copy'}
          </button>
       </div>
       <div className="p-4 overflow-x-auto custom-scrollbar">
          <code className="text-sm font-mono text-[#d4d4d4] whitespace-pre block">{code.trim()}</code>
       </div>
    </div>
  );
};

// Message Bubble Component to handle individual message state (Copy, Speak)
const MessageBubble: React.FC<{ msg: Message, onSpeak: (text: string) => void }> = ({ msg, onSpeak }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isImage = (mime?: string) => mime && mime.startsWith('image/');

  const renderMessageContent = (text: string) => {
      const parts = text.split('```');
      return parts.map((part, i) => {
          if (i % 2 === 1) {
              // This is code
              const lines = part.split('\n');
              const language = lines[0].trim();
              const code = lines.slice(1).join('\n');
              return <CodeBlock key={i} language={language} code={code} />;
          }
          return <span key={i} className="whitespace-pre-wrap">{part}</span>;
      });
  };

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-lg backdrop-blur-sm border ${
          msg.role === 'user' 
            ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-blue-400/30 rounded-br-sm' 
            : 'bg-slate-800/80 text-slate-100 border-white/10 rounded-bl-sm'
        }`}
      >
        {msg.image && (
            <div className="mb-3">
              {msg.image.startsWith('data:video') ? (
                  <video src={msg.image} controls className="w-full max-w-sm rounded-lg border border-white/10" />
              ) : isImage(msg.mimeType) ? (
                  <img src={msg.image} alt="content" className="w-full max-w-sm rounded-lg border border-white/10" />
              ) : (
                  <div className="flex items-center gap-3 bg-black/30 p-3 rounded-lg border border-white/10">
                      <Icons.FileText className="w-8 h-8 text-neon" />
                      <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium truncate max-w-[200px]">{msg.fileName || 'Attachment'}</span>
                          <span className="text-xs text-slate-400">{msg.mimeType}</span>
                      </div>
                  </div>
              )}
            </div>
        )}
        
        <div className="prose prose-invert prose-sm max-w-none">
          {renderMessageContent(msg.text)}
        </div>

        {(msg.webSources || msg.mapSources) && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                {msg.webSources?.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-blue-300 truncate max-w-[200px] block">
                        {s.title}
                    </a>
                ))}
                {msg.mapSources?.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-green-300 truncate max-w-[200px] block">
                        📍 {s.title}
                    </a>
                ))}
            </div>
        )}

        {/* Footer Actions */}
        {msg.role === 'model' && (
           <div className="mt-3 flex items-center gap-4 border-t border-white/5 pt-2">
               <button 
                  onClick={() => onSpeak(msg.text)}
                  className="text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-slate-400 hover:text-neon transition-colors"
               >
                  <Icons.Play className="w-3 h-3" /> Listen
               </button>
               <button 
                  onClick={handleCopyMessage}
                  className="text-[10px] uppercase tracking-wider flex items-center gap-1.5 text-slate-400 hover:text-neon transition-colors"
               >
                  {copied ? <Icons.Check className="w-3 h-3 text-green-400" /> : <Icons.Copy className="w-3 h-3" />}
                  {copied ? <span className="text-green-400">Copied</span> : 'Copy Text'}
               </button>
           </div>
        )}
      </div>
    </div>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ state, onSendMessage, onUpdateConfig, droppedFile, clearDroppedFile }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  // Sync dropped file
  useEffect(() => {
    if (droppedFile) {
        handleFileSelection(droppedFile);
        if (clearDroppedFile) clearDroppedFile();
    }
  }, [droppedFile]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.messages, state.isThinking]);

  const handleFileSelection = (file: File) => {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
          setPreviewUrl(URL.createObjectURL(file));
      } else {
          setPreviewUrl(null);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !selectedFile) return;
    onSendMessage(inputText, selectedFile || undefined);
    setInputText('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSpeak = async (text: string) => {
      const audioBuffer = await speakText(text);
      if (audioBuffer) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const buffer = pcmToAudioBuffer(audioBuffer, audioContext);
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
      }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6">
      
      {/* Settings Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
          {state.currentFeature === FeatureType.CHAT && (
             <>
                <button 
                  onClick={() => onUpdateConfig('useSearch', !state.useSearch)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${state.useSearch ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-slate-800 border-white/10 text-slate-400'}`}
                >
                    <Icons.Globe className="w-3 h-3" /> Grounding
                </button>
                <button 
                  onClick={() => onUpdateConfig('useMaps', !state.useMaps)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${state.useMaps ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-slate-800 border-white/10 text-slate-400'}`}
                >
                    <Icons.MapPin className="w-3 h-3" /> Maps
                </button>
                <button 
                  onClick={() => onUpdateConfig('useThinking', !state.useThinking)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${state.useThinking ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-slate-800 border-white/10 text-slate-400'}`}
                >
                    <Icons.Brain className="w-3 h-3" /> Deep Think
                </button>
             </>
          )}

          {state.currentFeature === FeatureType.IMAGE_GEN && (
             <>
               <div className="flex bg-slate-800 rounded-md p-0.5 border border-white/10">
                  {['generate', 'edit', 'analyze'].map(m => (
                      <button 
                        key={m}
                        onClick={() => onUpdateConfig('imageMode', m)}
                        className={`px-3 py-1 rounded text-xs capitalize ${state.imageMode === m ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                      >
                          {m}
                      </button>
                  ))}
               </div>
               
               {state.imageMode === 'generate' && (
                 <>
                   <select 
                      value={state.imageAspectRatio}
                      onChange={(e) => onUpdateConfig('imageAspectRatio', e.target.value)}
                      className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded px-2 outline-none"
                   >
                      <option value="1:1">1:1 Square</option>
                      <option value="16:9">16:9 Landscape</option>
                      <option value="9:16">9:16 Portrait</option>
                      <option value="3:4">3:4</option>
                      <option value="4:3">4:3</option>
                   </select>
                   <select 
                      value={state.imageSize}
                      onChange={(e) => onUpdateConfig('imageSize', e.target.value)}
                      className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded px-2 outline-none"
                   >
                      <option value="1K">1K Res</option>
                      <option value="2K">2K Res</option>
                      <option value="4K">4K Res</option>
                   </select>
                 </>
               )}
             </>
          )}

          {state.currentFeature === FeatureType.VIDEO_CREATOR && (
               <select 
                  value={state.videoAspectRatio}
                  onChange={(e) => onUpdateConfig('videoAspectRatio', e.target.value)}
                  className="bg-slate-800 text-xs text-slate-300 border border-white/10 rounded px-2 outline-none"
               >
                  <option value="16:9">16:9 Landscape</option>
                  <option value="9:16">9:16 Portrait</option>
               </select>
          )}
      </div>

      {/* Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2"
      >
        {state.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-60">
            <Icons.Cpu className="w-16 h-16 mb-4 text-neon animate-float" />
            <h2 className="text-2xl font-bold text-white mb-2">OmniMind AI</h2>
            <p>Drag & Drop files, upload code, or ask me anything.</p>
          </div>
        )}

        {state.messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onSpeak={handleSpeak} />
        ))}

        {state.isThinking && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-white/10 flex items-center gap-2">
              <span className="text-xs text-slate-400 mr-2">
                 {state.currentFeature === FeatureType.VIDEO_CREATOR ? 'Rendering Video (this may take a moment)...' : 
                  state.useThinking ? 'Thinking Deeply...' : 'Processing...'}
              </span>
              <div className="w-2 h-2 bg-neon rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-neon rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-neon rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="glass-panel rounded-xl p-3 flex flex-col gap-2 relative z-10 shadow-2xl shadow-neon/10">
        {selectedFile && (
          <div className="relative w-fit bg-slate-800 rounded-lg overflow-hidden border border-white/20 ml-2 mt-2 p-1">
            {previewUrl ? (
                <img src={previewUrl} className="w-20 h-20 object-cover opacity-80" alt="Preview" />
            ) : (
                <div className="w-20 h-20 flex flex-col items-center justify-center text-slate-300">
                    <Icons.FileText className="w-8 h-8 mb-1" />
                    <span className="text-[10px] truncate w-full text-center px-1">{selectedFile?.name}</span>
                </div>
            )}
            <button 
              onClick={() => { setPreviewUrl(null); setSelectedFile(null); }}
              className="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-bl"
            >
              ✕
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
           <label className="p-2 text-slate-400 hover:text-white cursor-pointer transition-colors hover:bg-white/5 rounded-full" title="Upload File (Image, PDF, Code, Text)">
            <input 
                type="file" 
                className="hidden" 
                multiple={false}
                onChange={handleFileChange} 
            />
            <Icons.Upload className="w-5 h-5" />
          </label>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={state.currentFeature === FeatureType.IMAGE_GEN ? "Describe the image..." : "Ask OmniMind..."}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-500 h-10 px-2"
          />

          <button className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-full">
            <Icons.Mic className="w-5 h-5" />
          </button>

          <button 
            onClick={handleSend}
            disabled={(!inputText && !selectedFile) || state.isThinking}
            className={`p-2 rounded-lg transition-all duration-300 ${
              inputText || selectedFile 
                ? 'bg-neon text-black shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:shadow-[0_0_25px_rgba(0,243,255,0.6)]' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Icons.Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};