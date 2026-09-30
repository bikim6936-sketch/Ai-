import React, { useState } from 'react';
import { Mic, MicOff, Send, AlertCircle, RefreshCw, Keyboard } from 'lucide-react';
import { VoiceState } from '../types';

interface MicControllerProps {
  voiceState: VoiceState;
  onToggleMic: () => void;
  onSendMessage: (text: string) => void;
  permissionError: string | null;
  onDismissPermissionError: () => void;
  onRequestMicRetry: () => void;
}

export const MicController: React.FC<MicControllerProps> = ({
  voiceState,
  onToggleMic,
  onSendMessage,
  permissionError,
  onDismissPermissionError,
  onRequestMicRetry,
}) => {
  const [inputText, setInputText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'thinking';

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (inputText.trim() && !isThinking) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border-t border-slate-800/80 px-3 py-3 backdrop-blur-md">
      <div className="max-w-xl mx-auto flex flex-col items-center gap-2.5">
        {/* Permission Error Banner */}
        {permissionError && (
          <div className="w-full p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Microphone Access Needed:</span>{' '}
                {permissionError}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                onClick={onRequestMicRetry}
                className="px-2.5 py-1 rounded-md bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry Mic
              </button>
              <button
                onClick={onDismissPermissionError}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Text Input Row (Expandable or standard) */}
        <form
          onSubmit={handleSend}
          className="w-full flex items-center gap-2 bg-slate-800/90 rounded-2xl p-1.5 border border-slate-700/80 shadow-inner"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Baby is listening to your voice...'
                : 'Type message or tap mic to speak...'
            }
            disabled={isThinking}
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />

          {inputText.trim() ? (
            <button
              type="submit"
              disabled={isThinking}
              className="p-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleMic}
              disabled={isThinking}
              className={`p-2 rounded-xl transition-all active:scale-90 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-rose-300 hover:bg-slate-700'
              }`}
              title="Toggle voice mic"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Big Central Mic Button for Mobile Voice Convenience */}
        <div className="relative flex flex-col items-center">
          {/* Animated Glowing Ring when Listening */}
          {isListening && (
            <div className="absolute -inset-2 rounded-full bg-rose-500/30 blur-md animate-ping pointer-events-none" />
          )}

          <button
            onClick={onToggleMic}
            disabled={isThinking}
            className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 active:scale-90 ${
              isListening
                ? 'bg-gradient-to-tr from-rose-600 to-pink-500 text-white ring-4 ring-rose-400/60 shadow-rose-500/50 scale-105'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 text-rose-400 hover:text-rose-300 border-2 border-rose-500/40 hover:border-rose-400 shadow-slate-950/60'
            }`}
            aria-label={isListening ? "Stop listening" : "Start speaking to Baby"}
          >
            {isListening ? (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8 animate-bounce" />
            ) : (
              <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </button>

          <span className="text-[11px] font-bold text-slate-400 mt-1.5">
            {isListening ? (
              <span className="text-rose-400 animate-pulse">Tap to Stop</span>
            ) : (
              <span>Tap to Speak 🎙️</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
