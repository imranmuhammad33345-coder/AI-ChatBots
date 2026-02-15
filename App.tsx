import React, { useState, useCallback, useEffect } from 'react';
import { AppState, FeatureType, Message, User } from './types';
import { FEATURES, MODELS } from './constants';
import { 
    generateTextResponse, 
    generateImageWithConfig, 
    editImage, 
    generateVeoVideo 
} from './services/geminiService';
import { auth, logout } from './services/firebaseConfig';
import Background from './components/Background';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';
import { WebDesigner } from './components/WebDesigner';
import { Login } from './components/Login';
import { Icons } from './components/Icons';
import { onAuthStateChanged } from 'firebase/auth';
import { downloadSourceCode } from './services/downloadService';

// Helper: Check if file is text-based
const isTextFile = (file: File) => {
    const textTypes = ['text/plain', 'text/javascript', 'text/x-typescript', 'text/x-python', 'text/csv', 'text/markdown', 'text/html', 'text/css', 'application/json'];
    if (textTypes.includes(file.type)) return true;
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['js', 'jsx', 'ts', 'tsx', 'py', 'txt', 'md', 'csv', 'json', 'html', 'css', 'env'].includes(ext || '');
};

const getMimeType = (file: File) => {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'jsx') return 'text/javascript';
    if (ext === 'ts' || ext === 'tsx') return 'text/x-typescript';
    if (ext === 'py') return 'text/x-python';
    if (ext === 'csv') return 'text/csv';
    if (ext === 'md') return 'text/markdown';
    if (ext === 'json') return 'application/json';
    return 'application/octet-stream';
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const [state, setState] = useState<AppState>({
    currentFeature: FeatureType.DASHBOARD,
    messages: [],
    isThinking: false,
    user: null,
    sidebarOpen: false,
    // Config Defaults
    activeModel: MODELS.TEXT_FAST,
    useSearch: false,
    useMaps: false,
    useThinking: false,
    imageAspectRatio: "1:1",
    imageSize: "1K",
    videoAspectRatio: "16:9",
    imageMode: 'generate'
  });

  // Memory System: Load messages from local storage
  useEffect(() => {
    const savedMemory = localStorage.getItem('omnimind_memory_v1');
    if (savedMemory) {
        try {
            const parsed = JSON.parse(savedMemory);
            if (Array.isArray(parsed)) {
                setState(prev => ({ ...prev, messages: parsed }));
            }
        } catch (e) {
            console.error("Failed to load memory", e);
        }
    }
  }, []);

  // Memory System: Save messages to local storage
  useEffect(() => {
      if (state.messages.length > 0) {
        localStorage.setItem('omnimind_memory_v1', JSON.stringify(state.messages));
      }
  }, [state.messages]);

  // Auth Listener
  useEffect(() => {
     if (!auth) {
         setLoading(false);
         return;
     }
     const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
         if (firebaseUser) {
             const appUser: User = {
                 id: firebaseUser.uid,
                 name: firebaseUser.displayName || 'User',
                 email: firebaseUser.email || '',
                 avatar: firebaseUser.photoURL || undefined,
                 plan: 'free'
             };
             setState(prev => ({ ...prev, user: appUser }));
         } else {
             setState(prev => ({ ...prev, user: null }));
         }
         setLoading(false);
     });
     return () => unsubscribe();
  }, []);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const file = e.dataTransfer.files[0];
          setDroppedFile(file);
          // If we are on dashboard, switch to chat to show upload
          if (state.currentFeature === FeatureType.DASHBOARD) {
              setState(prev => ({...prev, currentFeature: FeatureType.CHAT}));
          }
      }
  };

  const handleLoginSuccess = (firebaseUser: any) => {
      const appUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || undefined,
            plan: 'free'
      };
      setState(prev => ({ ...prev, user: appUser }));
  };

  const handleLogout = async () => {
      await logout();
      localStorage.removeItem('omnimind_memory_v1'); // Clear memory on logout
      setState(prev => ({ ...prev, user: null, messages: [], currentFeature: FeatureType.DASHBOARD }));
  };

  const addMessage = (msg: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, msg]
    }));
  };

  const handleUpdateConfig = (key: string, value: any) => {
      setState(prev => ({ ...prev, [key]: value }));
  };

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    // 1. Prepare User Message
    const userMsgId = Date.now().toString();
    
    // File Processing
    let fileBase64: string | undefined = undefined;
    let fileContent: string | undefined = undefined;
    let mimeType = file ? getMimeType(file) : undefined;

    if (file) {
      if (isTextFile(file)) {
          // Read as Text for Code/CSV
          fileContent = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsText(file);
          });
      } else {
          // Read as Base64 for Image/PDF
          fileBase64 = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
          });
      }
    }

    const rawBase64 = fileBase64 ? fileBase64.split(',')[1] : undefined;
    
    // Construct Prompt with Text Content if applicable
    let finalUserText = text;
    if (fileContent) {
        finalUserText = `${text}\n\n--- FILE: ${file?.name} ---\n\`\`\`\n${fileContent}\n\`\`\``;
    }

    addMessage({
      id: userMsgId,
      role: 'user',
      text: finalUserText,
      timestamp: Date.now(),
      image: fileBase64, // For UI
      mimeType: mimeType,
      fileName: file?.name
    });

    setState(prev => ({ ...prev, isThinking: true }));

    try {
      // --- ROUTING LOGIC ---

      if (state.currentFeature === FeatureType.IMAGE_GEN) {
          if (state.imageMode === 'generate') {
             const imgData = await generateImageWithConfig(text, { 
                 aspectRatio: state.imageAspectRatio, 
                 imageSize: state.imageSize 
             });
             if (imgData) {
                 addMessage({
                    id: Date.now().toString(), role: 'model', text: `Generated: ${text}`, timestamp: Date.now(), image: imgData, mimeType: 'image/png'
                 });
             } else {
                 throw new Error("Image generation failed");
             }
          } else if (state.imageMode === 'edit') {
             if (!rawBase64 || !mimeType?.startsWith('image/')) {
                 addMessage({ id: Date.now().toString(), role: 'model', text: "Please upload an image to edit.", timestamp: Date.now() });
             } else {
                 const imgData = await editImage(rawBase64, text);
                 if (imgData) {
                    addMessage({
                        id: Date.now().toString(), role: 'model', text: `Edited Image: ${text}`, timestamp: Date.now(), image: imgData, mimeType: 'image/png'
                     });
                 } else {
                     throw new Error("Image editing failed");
                 }
             }
          } else {
             // Analyze (use standard flow below for analysis but keep feature context)
             // Fall through to standard generation, but force text output
             const { text: responseText } = await generateTextResponse(
                 { text: finalUserText, fileData: rawBase64 ? { mimeType: mimeType!, data: rawBase64 } : undefined },
                 [],
                 { modelName: MODELS.TEXT_PRO }
             );
             addMessage({ id: Date.now().toString(), role: 'model', text: responseText, timestamp: Date.now() });
          }

      } else if (state.currentFeature === FeatureType.VIDEO_CREATOR) {
          const videoUrl = await generateVeoVideo(text, rawBase64, state.videoAspectRatio);
          if (videoUrl) {
              addMessage({
                id: Date.now().toString(), role: 'model', text: `Here is your video for: ${text}`, timestamp: Date.now(), image: videoUrl, mimeType: 'video/mp4' 
             });
          } else {
               addMessage({ id: Date.now().toString(), role: 'model', text: "Video generation failed or was cancelled.", timestamp: Date.now() });
          }

      } else {
         // Standard Chat / Code / Web Design
         const history = state.messages.map(m => {
            const parts: any[] = [];
            parts.push({ text: m.text });
            return { role: m.role, parts };
         });

         let prompt = finalUserText;
         let useThinking = state.useThinking;

         if (state.currentFeature === FeatureType.CODE_STUDIO) {
             prompt = `(Role: Senior Software Engineer) ${finalUserText}`;
             useThinking = true; 
         } else if (state.currentFeature === FeatureType.WEB_DESIGNER) {
             prompt = `Act as an expert frontend web developer. Create a modern, single-file HTML website based on: "${finalUserText}". Output ONLY code inside \`\`\`html blocks.`;
         }

         // Call Service
         const { text: responseText, webSources, mapSources } = await generateTextResponse(
             { 
                 text: prompt, 
                 fileData: rawBase64 ? { mimeType: mimeType || 'application/pdf', data: rawBase64 } : undefined 
             },
             history,
             {
                 modelName: state.activeModel,
                 useSearch: state.useSearch,
                 useMaps: state.useMaps,
                 useThinking: useThinking
             }
         );

         addMessage({
            id: Date.now().toString(),
            role: 'model',
            text: responseText,
            timestamp: Date.now(),
            webSources,
            mapSources
          });
      }

    } catch (error) {
      console.error(error);
      addMessage({
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error. Please try again or check your file format.",
        timestamp: Date.now(),
        isError: true
      });
    } finally {
      setState(prev => ({ ...prev, isThinking: false }));
      setDroppedFile(null); // Clear drop
    }
  }, [state]);

  const toggleSidebar = () => setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  
  const switchFeature = (feature: FeatureType, initialPrompt?: string) => {
    setState(prev => {
        let newMessages = [];
        if (initialPrompt && feature === FeatureType.CHAT) {
             newMessages = [{
                 id: 'init',
                 role: 'model' as const,
                 text: `**System Ready.** ${initialPrompt}`,
                 timestamp: Date.now()
             }];
        }
        return { 
            ...prev, 
            currentFeature: feature, 
            sidebarOpen: false, 
            messages: newMessages
        };
    });
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center h-screen bg-slate-950">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon"></div>
          </div>
      )
  }

  if (!state.user) {
      return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div 
        className="relative w-full h-screen flex flex-col md:flex-row overflow-hidden font-sans"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      <Background />
      
      {isDragging && (
          <div className="absolute inset-0 z-50 bg-neon/10 backdrop-blur-sm border-4 border-neon border-dashed flex items-center justify-center pointer-events-none">
              <div className="bg-black/80 p-8 rounded-2xl flex flex-col items-center animate-bounce">
                  <Icons.Upload className="w-16 h-16 text-neon mb-4" />
                  <h2 className="text-2xl font-bold text-white">Drop File to Upload</h2>
              </div>
          </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass-panel border-b border-white/10 z-40 relative">
        <div className="flex items-center gap-2">
            <Icons.Cpu className="text-neon" />
            <span className="font-bold text-lg">UI Chatbots</span>
        </div>
        <button onClick={toggleSidebar} className="text-white">
            <Icons.Menu />
        </button>
      </div>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 border-r border-white/10 flex flex-col ${
          state.sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 hidden md:flex items-center gap-2 border-b border-white/10">
          <Icons.Cpu className="w-8 h-8 text-neon animate-pulse-slow" />
          <h1 className="text-xl font-bold tracking-wider">UI Chatbots</h1>
        </div>
        
        {/* User Profile in Sidebar */}
        <div className="p-4 border-b border-white/10 bg-black/20">
            <div className="flex items-center gap-3">
                <img 
                    src={state.user.avatar || `https://ui-avatars.com/api/?name=${state.user.name}&background=random`} 
                    alt="User" 
                    className="w-10 h-10 rounded-full border border-neon/50"
                />
                <div className="overflow-hidden">
                    <div className="font-bold text-sm truncate">{state.user.name}</div>
                    <div className="text-xs text-slate-400 truncate">{state.user.email}</div>
                </div>
            </div>
        </div>

        <div className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
          {FEATURES.map(feat => {
            const Icon = (Icons as any)[feat.icon];
            const isActive = state.currentFeature === feat.id;
            return (
              <button
                key={feat.id}
                onClick={() => switchFeature(feat.id as FeatureType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-neon/10 text-neon border border-neon/20 shadow-[0_0_15px_rgba(0,243,255,0.1)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-neon' : 'group-hover:text-neon transition-colors'}`} />
                <span className="font-medium">{feat.label}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_8px_rgba(0,243,255,0.8)]"></div>}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10 space-y-2">
            <button 
                onClick={downloadSourceCode}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
                <Icons.Download className="w-5 h-5" />
                <span className="font-medium">Download Project</span>
            </button>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
            >
                <Icons.LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">
        {state.currentFeature === FeatureType.DASHBOARD ? (
          <div className="flex-1 overflow-y-auto">
            <Dashboard onSelectFeature={switchFeature} />
          </div>
        ) : state.currentFeature === FeatureType.LIVE ? (
          <LiveInterface />
        ) : state.currentFeature === FeatureType.WEB_DESIGNER ? (
          <WebDesigner state={state} onSendMessage={handleSendMessage} />
        ) : (
          <div className="flex-1 flex flex-col h-full">
            {/* Header for Active Feature */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-neon">/</span> 
                    {FEATURES.find(f => f.id === state.currentFeature)?.label || 'App'}
                </h2>
                {state.currentFeature === FeatureType.CHAT && (
                    <div className="flex items-center gap-2">
                        <select 
                            value={state.activeModel}
                            onChange={(e) => handleUpdateConfig('activeModel', e.target.value)}
                            className="bg-slate-900 border border-white/10 text-xs rounded-md px-2 py-1 outline-none text-slate-300"
                        >
                            <option value={MODELS.TEXT_FAST}>Gemini Flash (Fast)</option>
                            <option value={MODELS.TEXT_PRO}>Gemini Pro (Smart)</option>
                            <option value={MODELS.TEXT_LITE}>Gemini Lite (Speed)</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-hidden relative">
                <ChatInterface 
                    state={state}
                    onSendMessage={handleSendMessage}
                    onUpdateConfig={handleUpdateConfig}
                    droppedFile={droppedFile}
                    clearDroppedFile={() => setDroppedFile(null)}
                />
            </div>
          </div>
        )}
      </main>

      {state.sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
            onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
}