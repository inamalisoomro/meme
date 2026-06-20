export interface MemeTemplate {
  id: string;
  name: string;
  imageUrl: string;
  presetTop?: string;
  presetBottom?: string;
}

export interface Meme {
  id: string;
  templateId: string;
  topText: string;
  bottomText: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: any;
  }>;
}

export interface ChatRequest {
  message: string;
  history: Array<{
    role: 'user' | 'model';
    text: string;
  }>;
}

export interface ChatResponse {
  text: string;
  memes: Meme[];
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: string;
  }>;
}
