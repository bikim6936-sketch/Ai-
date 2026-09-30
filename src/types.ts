export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  audioBase64?: string | null;
  detectedLanguage?: 'hindi' | 'hinglish' | 'english' | 'other';
  interactiveSteps?: string[];
  suggestedTimerMinutes?: number;
}

export interface AssistantSettings {
  autoSpeak: boolean;
  language: 'auto' | 'hi-IN' | 'en-IN' | 'en-US';
  voiceSpeed: number; // 0.8 - 1.3
  voicePitch: number; // 0.9 - 1.4
  preferStudioVoice: boolean; // Gemini TTS vs Browser
}
