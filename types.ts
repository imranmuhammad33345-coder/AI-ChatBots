export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: number;
  image?: string; // base64 data
  mimeType?: string; // mime type of the attachment
  fileName?: string; // original filename
  isError?: boolean;
  webSources?: { uri: string; title: string }[];
  mapSources?: { uri: string; title: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export enum FeatureType {
  CHAT = 'CHAT',
  IMAGE_GEN = 'IMAGE_GEN',
  VIDEO_CREATOR = 'VIDEO_CREATOR',
  LIVE = 'LIVE',
  CODE_STUDIO = 'CODE_STUDIO',
  WEB_DESIGNER = 'WEB_DESIGNER',
  DASHBOARD = 'DASHBOARD'
}

export interface AppState {
  currentFeature: FeatureType;
  messages: Message[];
  isThinking: boolean;
  user: User | null; // User can be null if not logged in
  sidebarOpen: boolean;
  // Configs
  activeModel: string;
  useSearch: boolean;
  useMaps: boolean;
  useThinking: boolean;
  imageAspectRatio: string;
  imageSize: string;
  videoAspectRatio: string;
  imageMode: 'generate' | 'edit' | 'analyze';
}

export interface CodeSnippet {
  language: string;
  code: string;
}