export const MODELS = {
  TEXT_FAST: 'gemini-3-flash-preview',
  TEXT_PRO: 'gemini-3-pro-preview',
  TEXT_LITE: 'gemini-flash-lite-latest',
  IMAGE_GEN: 'gemini-3-pro-image-preview', // High quality
  IMAGE_EDIT: 'gemini-2.5-flash-image',
  VIDEO: 'veo-3.1-fast-generate-preview',
  TTS: 'gemini-2.5-flash-preview-tts',
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025',
  MAPS: 'gemini-2.5-flash'
};

export const INITIAL_SYSTEM_INSTRUCTION = `
You are UI Chatbots AI, a world-class Senior Software Engineer and Creative Designer.
Your goal is to provide high-precision, production-ready solutions.

Personality & Rules:
1.  **Expert Coding:** When asked for code, provide complete, modern, and clean code (React, HTML5, Tailwind, Python). Always explain *why* you chose a specific approach.
2.  **Visual Genius:** You have a great sense of aesthetics. When generating HTML/CSS, ensure it looks amazing, modern, and responsive.
3.  **Concise & Direct:** Do not waste time with pleasantries. Get straight to the answer.
4.  **Formatting:** Use Markdown for structure. Use code blocks for all code.
5.  **Multimodal:** If you see an image, analyze it like a computer vision expert.
`;

export const FEATURES = [
  { id: 'DASHBOARD', icon: 'LayoutDashboard', label: 'App Store' },
  { id: 'CHAT', icon: 'MessageSquare', label: 'Smart Chat' },
  { id: 'WEB_DESIGNER', icon: 'Layout', label: 'Web Designer' },
  { id: 'LIVE', icon: 'Mic', label: 'Live Voice' },
  { id: 'IMAGE_GEN', icon: 'Image', label: 'Vision Studio' },
  { id: 'VIDEO_CREATOR', icon: 'Video', label: 'Video Lab' },
  { id: 'CODE_STUDIO', icon: 'Code', label: 'Dev Studio' },
];

export const AI_APPS = [
    { id: 'chat_gen', name: 'General Chat', icon: 'MessageSquare', description: 'Ask anything, explore ideas', featureId: 'CHAT' },
    { id: 'web_builder', name: 'Web Designer', icon: 'Layout', description: 'Design websites from text', featureId: 'WEB_DESIGNER' },
    { id: 'image_studio', name: 'Vision Studio', icon: 'Image', description: 'Generate & Edit Art', featureId: 'IMAGE_GEN' },
    { id: 'live_voice', name: 'Live Conversation', icon: 'Mic', description: 'Real-time voice chat', featureId: 'LIVE' },
    { id: 'code_dev', name: 'Dev Studio', icon: 'Code', description: 'Code generator & debugger', featureId: 'CODE_STUDIO' },
    { id: 'video_lab', name: 'Video Lab', icon: 'Video', description: 'Text to Video creation', featureId: 'VIDEO_CREATOR' },
    
    // Specialized Wrappers
    { id: 'seo_writer', name: 'SEO AI Wizard', icon: 'PenTool', description: 'Rank #1 on Google', featureId: 'CHAT', prompt: 'Act as a World-Class SEO Expert and Content Strategist. I need content that ranks #1 on Google. Ask me for the topic, target keywords, and tone. Then generate a comprehensive article with meta tags, H1/H2 structures, and keyword density analysis.' },
    { id: 'resume_builder', name: 'Resume Builder', icon: 'Briefcase', description: 'Craft professional CVs', featureId: 'CHAT', prompt: 'Act as a professional Resume Writer. Help me build or improve my resume. Start by asking for my current experience or a file upload.' },
    { id: 'data_analyst', name: 'Data Analyst', icon: 'BarChart', description: 'Analyze CSV & Data', featureId: 'CHAT', prompt: 'Act as a Senior Data Analyst. Please ask me to upload a CSV or dataset, and I will provide insights, trends, and visualization suggestions.' },
    { id: 'math_tutor', name: 'Math Solver', icon: 'Calculator', description: 'Step-by-step solutions', featureId: 'CHAT', prompt: 'Act as a Math Tutor. Solve problems step-by-step, explain concepts clearly, and help me learn.' },
    { id: 'translator', name: 'Translator', icon: 'Globe', description: 'Universal Translator', featureId: 'CHAT', prompt: 'Act as a Universal Translator. I will provide text and you will translate it accurately while preserving nuance. Ask me for the target language.' },
    { id: 'summarizer', name: 'Doc Summarizer', icon: 'FileText', description: 'Summarize PDFs/Docs', featureId: 'CHAT', prompt: 'Act as a Document Assistant. Please upload a PDF or text file, and I will summarize it, extract key points, or answer questions about it.' },
];

export const MOCK_USER = {
  id: 'usr_123',
  name: 'Neo Developer',
  plan: 'pro' as const
};