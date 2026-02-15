import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { MODELS } from "../constants";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Text & General (Enhanced for Multimodal) ---

export const generateTextResponse = async (
  currentMessage: { text: string; fileData?: { mimeType: string; data: string } },
  history: { role: string; parts: { text?: string; inlineData?: any }[] }[],
  config: { 
      modelName: string; 
      useSearch?: boolean; 
      useMaps?: boolean; 
      useThinking?: boolean 
  }
): Promise<{ 
    text: string; 
    webSources?: {uri: string; title: string}[]; 
    mapSources?: {uri: string; title: string}[]; 
}> => {
  const ai = getAI();
  const tools: any[] = [];
  let modelToUse = config.modelName;

  // Thinking Config
  let thinkingConfig = undefined;
  if (config.useThinking) {
      modelToUse = MODELS.TEXT_PRO;
      thinkingConfig = { thinkingBudget: 32768 };
  }

  // Grounding Config
  if (config.useSearch) {
      tools.push({ googleSearch: {} });
      if (!config.useThinking) modelToUse = MODELS.TEXT_FAST; 
  }
  
  if (config.useMaps) {
      tools.push({ googleMaps: {} });
      modelToUse = MODELS.MAPS; 
  }

  // Maps Location Config
  let toolConfig = undefined;
  if (config.useMaps) {
      try {
        const position: any = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000});
        });
        toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                }
            }
        };
      } catch (e) { console.warn("Location denied"); }
  }

  // Prepare Current Message Parts
  const currentParts: any[] = [];
  if (currentMessage.fileData) {
      currentParts.push({ 
          inlineData: {
              mimeType: currentMessage.fileData.mimeType,
              data: currentMessage.fileData.data
          }
      });
  }
  if (currentMessage.text) {
      currentParts.push({ text: currentMessage.text });
  }

  const chat = ai.chats.create({
    model: modelToUse,
    history: history,
    config: {
        systemInstruction: "You are a helpful, expert AI assistant. Output Markdown.",
        tools: tools.length > 0 ? tools : undefined,
        toolConfig: toolConfig,
        thinkingConfig: thinkingConfig
    }
  });

  // Use sendMessage with parts
  const response: GenerateContentResponse = await chat.sendMessage({
    content: { parts: currentParts }
  });

  // Extract Sources
  const webSources: any[] = [];
  const mapSources: any[] = [];
  
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  chunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
          webSources.push({ uri: chunk.web.uri, title: chunk.web.title || 'Source' });
      }
      if (chunk.maps?.uri) {
          mapSources.push({ uri: chunk.maps.uri, title: chunk.maps.title || 'Map Location' });
      }
  });

  return { 
      text: response.text || "No response generated.",
      webSources,
      mapSources
  };
};

// --- Vision (Images & Video Analysis) ---

export const generateImageWithConfig = async (prompt: string, config: { aspectRatio: string; imageSize: string }): Promise<string | null> => {
    const ai = getAI();
    try {
        // Use Gemini 3 Pro Image for High Quality
        const response = await ai.models.generateContent({
            model: MODELS.IMAGE_GEN,
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: config.aspectRatio,
                    imageSize: config.imageSize
                }
            }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Gen Image Error", e);
        return null;
    }
};

export const editImage = async (imageBase64: string, prompt: string): Promise<string | null> => {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: MODELS.IMAGE_EDIT, // Gemini 2.5 Flash Image
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
                    { text: prompt }
                ]
            }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Edit Image Error", e);
        return null;
    }
}

// --- Video Generation (Veo) ---

export const generateVeoVideo = async (prompt: string, imageBase64: string | undefined, aspectRatio: string): Promise<string | null> => {
    // 1. Check/Get Key
    // @ts-ignore
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            // @ts-ignore
            await window.aistudio.openSelectKey();
        }
    }

    // 2. Create NEW instance to pick up the key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        let operation;
        if (imageBase64) {
             operation = await ai.models.generateVideos({
                model: MODELS.VIDEO,
                prompt: prompt || "Animate this image",
                image: {
                    imageBytes: imageBase64,
                    mimeType: 'image/jpeg'
                },
                config: {
                    numberOfVideos: 1,
                    aspectRatio: aspectRatio as any
                }
            });
        } else {
            operation = await ai.models.generateVideos({
                model: MODELS.VIDEO,
                prompt: prompt,
                config: {
                    numberOfVideos: 1,
                    aspectRatio: aspectRatio as any
                }
            });
        }

        // Poll
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
             // Fetch bytes
             const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             const blob = await response.blob();
             return URL.createObjectURL(blob);
        }
        return null;

    } catch (e) {
        console.error("Veo Error", e);
        return null;
    }
}

// --- TTS ---

export const speakText = async (text: string): Promise<ArrayBuffer | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: MODELS.TTS,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
       return decodeAudio(base64Audio);
    }
    return null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// --- Helpers ---

function decodeAudio(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export const pcmToAudioBuffer = (buffer: ArrayBuffer, ctx: AudioContext, sampleRate: number = 24000): AudioBuffer => {
    const pcm16 = new Int16Array(buffer);
    const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
    }
    return audioBuffer;
}

// --- Live API Class (Simplified) ---

export class LiveClient {
    private ai: GoogleGenAI;
    public onAudioData: ((data: ArrayBuffer) => void) | null = null;
    public onInputVolume: ((volume: number) => void) | null = null;
    
    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    async connect(inputContext: AudioContext, outputContext: AudioContext) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Input Node
        const source = inputContext.createMediaStreamSource(stream);
        const processor = inputContext.createScriptProcessor(4096, 1, 1);
        
        const sessionPromise = this.ai.live.connect({
            model: MODELS.LIVE,
            callbacks: {
                onopen: () => console.log("Live Connected"),
                onmessage: (msg: any) => {
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData && this.onAudioData) {
                        this.onAudioData(decodeAudio(audioData));
                    }
                },
                onclose: () => console.log("Live Closed"),
                onerror: (e) => console.error("Live Error", e)
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                }
            }
        });

        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Calculate Volume for UI
            if (this.onInputVolume) {
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                this.onInputVolume(rms);
            }
            
            const pcmData = this.floatTo16BitPCM(inputData);
            const base64 = this.arrayBufferToBase64(pcmData);
            
            sessionPromise.then(session => {
                session.sendRealtimeInput({
                    media: {
                        mimeType: 'audio/pcm;rate=16000',
                        data: base64
                    }
                });
            });
        };

        source.connect(processor);
        processor.connect(inputContext.destination);

        return () => {
            source.disconnect();
            processor.disconnect();
            stream.getTracks().forEach(t => t.stop());
            sessionPromise.then(s => s.close());
        };
    }

    private floatTo16BitPCM(output: Float32Array) {
        const buffer = new ArrayBuffer(output.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < output.length; i++) {
            const s = Math.max(-1, Math.min(1, output[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}