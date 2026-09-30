import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType, VoiceState, AssistantSettings } from './types';
import { audioPlayer } from './utils/audioPlayer';
import { speechManager } from './utils/speechRecognition';
import { Header } from './components/Header';
import { BabyAvatar } from './components/BabyAvatar';
import { ListeningIndicator } from './components/ListeningIndicator';
import { ChatMessage } from './components/ChatMessage';
import { QuickPrompts } from './components/QuickPrompts';
import { MicController } from './components/MicController';
import { SettingsModal } from './components/SettingsModal';

const INITIAL_MESSAGES: ChatMessageType[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    text: 'Haan baby 😊! Main Baby hoon, aapki friendly voice assistant. Aap mujhse Hindi ya English mein baat kar sakte ho. Tap the mic button to talk to me! 🎙️✨',
    timestamp: Date.now(),
  },
];

export default function App() {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => {
    try {
      const saved = localStorage.getItem('baby_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return INITIAL_MESSAGES;
  });

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const [settings, setSettings] = useState<AssistantSettings>(() => {
    try {
      const saved = localStorage.getItem('baby_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return {
      autoSpeak: true,
      language: 'auto',
      voiceSpeed: 1.05,
      voicePitch: 1.25,
      preferStudioVoice: true,
    };
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync settings with Speech Manager
  useEffect(() => {
    speechManager.setLanguage(settings.language);
    try {
      localStorage.setItem('baby_settings', JSON.stringify(settings));
    } catch (e) {
      // ignore
    }
  }, [settings]);

  // Sync messages with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('baby_chat_history', JSON.stringify(messages.slice(-20)));
    } catch (e) {
      // ignore
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Connect Audio Player state with Baby's avatar animation
  useEffect(() => {
    audioPlayer.setListener((isPlaying) => {
      if (isPlaying) {
        setVoiceState('speaking');
      } else {
        setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
        setCurrentlyPlayingId(null);
      }
    });

    return () => {
      audioPlayer.stop();
      speechManager.stopListening();
    };
  }, []);

  const handleUpdateSettings = (newSettings: Partial<AssistantSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleClearChat = () => {
    audioPlayer.stop();
    speechManager.stopListening();
    setVoiceState('idle');
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('baby_chat_history');
    } catch (e) {
      // ignore
    }
  };

  // Helper to extract step-by-step points from text
  const extractSteps = (text: string): string[] | undefined => {
    const lines = text.split('\n');
    const steps: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(\d+[\.\)]|step\s*\d+:?)/i.test(trimmed)) {
        steps.push(trimmed.replace(/^(\d+[\.\)]|step\s*\d+:?)\s*/i, ''));
      }
    }
    return steps.length >= 2 ? steps : undefined;
  };

  // Helper to extract suggested timer in minutes from text or prompt
  const extractTimer = (userPrompt: string, replyText: string): number | undefined => {
    const combined = `${userPrompt} ${replyText}`.toLowerCase();
    const match = combined.match(/(\d+)\s*(?:min|minute|minutes|mint)/i);
    if (match && match[1]) {
      const mins = parseInt(match[1], 10);
      if (mins > 0 && mins <= 120) return mins;
    }
    return undefined;
  };

  // Send message to Baby
  const sendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    audioPlayer.stop();
    speechManager.stopListening();
    setInterimTranscript('');

    const userMessageId = `user-${Date.now()}`;
    const newUserMessage: ChatMessageType = {
      id: userMessageId,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setVoiceState('thinking');

    try {
      // Prepare history payload for server
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          language: settings.language,
          generateVoice: settings.autoSpeak && settings.preferStudioVoice,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const replyText =
        data.reply ||
        (userText.toLowerCase().includes('baby')
          ? 'Haan baby 😊, main hamesha aapke saath hoon!'
          : 'Haan baby 😊, main sun rahi hoon!');

      const steps = extractSteps(replyText);
      const timerMins = extractTimer(userText, replyText);

      const assistantMessageId = `assistant-${Date.now()}`;
      const newAssistantMessage: ChatMessageType = {
        id: assistantMessageId,
        role: 'assistant',
        text: replyText,
        timestamp: Date.now(),
        audioBase64: data.audioBase64 || null,
        interactiveSteps: steps,
        suggestedTimerMinutes: timerMins,
      };

      setMessages((prev) => [...prev, newAssistantMessage]);

      // Auto play speech response if enabled
      if (settings.autoSpeak) {
        setVoiceState('speaking');
        setCurrentlyPlayingId(assistantMessageId);
        await audioPlayer.play(replyText, data.audioBase64, {
          pitch: settings.voicePitch,
          rate: settings.voiceSpeed,
          lang: settings.language === 'auto' ? undefined : settings.language,
        });
      } else {
        setVoiceState('idle');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackText = userText.toLowerCase().includes('baby')
        ? 'Haan baby 😊, lagta hai chhota sa network issue ho gaya. Ek baar phir se bolo na!'
        : 'Haan baby 😊, ek second network check karke dobara try karo na!';

      const errorMsg: ChatMessageType = {
        id: `assistant-err-${Date.now()}`,
        role: 'assistant',
        text: fallbackText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      setVoiceState('idle');

      if (settings.autoSpeak) {
        audioPlayer.play(fallbackText, null, {
          pitch: settings.voicePitch,
          rate: settings.voiceSpeed,
        });
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (voiceState === 'listening') {
      speechManager.stopListening();
      setVoiceState('idle');
      setInterimTranscript('');
      return;
    }

    if (voiceState === 'speaking') {
      audioPlayer.stop();
      setVoiceState('idle');
    }

    setPermissionError(null);
    setInterimTranscript('');

    speechManager.startListening({
      onStart: () => {
        setVoiceState('listening');
        setPermissionError(null);
      },
      onInterimResult: (transcript) => {
        setInterimTranscript(transcript);
      },
      onFinalResult: (transcript) => {
        if (transcript.trim()) {
          setInterimTranscript(transcript);
          sendMessage(transcript);
        } else {
          setVoiceState('idle');
          setInterimTranscript('');
        }
      },
      onError: (errorMsg, isPermission) => {
        setVoiceState('idle');
        setInterimTranscript('');
        if (isPermission) {
          setPermissionError(errorMsg);
        }
      },
      onEnd: () => {
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
      },
    });
  };

  // Replay a specific message's voice
  const handleReplayMessage = async (msg: ChatMessageType) => {
    if (currentlyPlayingId === msg.id && voiceState === 'speaking') {
      audioPlayer.stop();
      setVoiceState('idle');
      setCurrentlyPlayingId(null);
      return;
    }

    setCurrentlyPlayingId(msg.id);
    setVoiceState('speaking');

    await audioPlayer.play(msg.text, msg.audioBase64, {
      pitch: settings.voicePitch,
      rate: settings.voiceSpeed,
      lang: settings.language === 'auto' ? undefined : settings.language,
    });
  };

  // Tapping Baby's avatar triggers a warm interactive reaction
  const handleAvatarClick = () => {
    if (voiceState === 'listening') {
      toggleMic();
      return;
    }

    if (voiceState === 'speaking') {
      audioPlayer.stop();
      return;
    }

    // Play quick greeting "Haan baby 😊, bolo na!"
    const greeting = 'Haan baby 😊, bolo na! Main sun rahi hoon.';
    audioPlayer.play(greeting, null, {
      pitch: settings.voicePitch,
      rate: settings.voiceSpeed,
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-xl mx-auto bg-slate-950 text-slate-100 shadow-2xl overflow-hidden relative">
      {/* Header */}
      <Header
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onClearChat={handleClearChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Baby Interactive Avatar Section */}
        <div className="shrink-0 pt-2 pb-1 px-4 bg-gradient-to-b from-slate-900/80 via-slate-900/40 to-transparent border-b border-slate-900/50">
          <BabyAvatar
            voiceState={voiceState}
            onClick={handleAvatarClick}
            statusText={
              voiceState === 'listening'
                ? 'Listening to you... 🎙️'
                : voiceState === 'speaking'
                ? 'Baby is talking... 🔊'
                : voiceState === 'thinking'
                ? 'Baby is thinking... ✨'
                : undefined
            }
          />

          {/* Quick Prompts Bar */}
          <div className="mt-1">
            <QuickPrompts
              onSelectPrompt={(text) => sendMessage(text)}
              disabled={voiceState === 'thinking' || voiceState === 'listening'}
            />
          </div>
        </div>

        {/* Listening Active Visualizer Modal/Overlay */}
        {voiceState === 'listening' && (
          <div className="p-3 shrink-0">
            <ListeningIndicator
              interimTranscript={interimTranscript}
              onStop={() => {
                speechManager.stopListening();
                if (interimTranscript.trim()) {
                  sendMessage(interimTranscript);
                } else {
                  setVoiceState('idle');
                }
              }}
              onCancel={() => {
                speechManager.stopListening();
                setVoiceState('idle');
                setInterimTranscript('');
              }}
              selectedLanguage={settings.language}
            />
          </div>
        )}

        {/* Scrollable Chat History */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 space-y-1">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onReplay={handleReplayMessage}
              isCurrentlySpeaking={currentlyPlayingId === message.id && voiceState === 'speaking'}
            />
          ))}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Bottom Voice & Text Input Dock */}
      <footer className="shrink-0 z-10">
        <MicController
          voiceState={voiceState}
          onToggleMic={toggleMic}
          onSendMessage={sendMessage}
          permissionError={permissionError}
          onDismissPermissionError={() => setPermissionError(null)}
          onRequestMicRetry={toggleMic}
        />
      </footer>

      {/* Settings & Info Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
