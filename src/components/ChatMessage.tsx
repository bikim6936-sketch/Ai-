import React, { useState, useEffect } from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { Volume2, VolumeX, Copy, Check, Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onReplay: (message: ChatMessageType) => void;
  isCurrentlySpeaking: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onReplay,
  isCurrentlySpeaking,
}) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  // Embedded Interactive Timer (if Baby suggested or user asked for a timer, e.g. "5 min timer")
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number | null>(
    message.suggestedTimerMinutes ? message.suggestedTimerMinutes * 60 : null
  );
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSecondsLeft !== null && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (timerSecondsLeft === 0 && timerRunning) {
      setTimerRunning(false);
      // Play a gentle beep or chime
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.connect(ctx.destination);
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
          // ignore
        }
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSecondsLeft]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`flex w-full mb-3.5 items-end gap-2.5 transition-all ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Assistant Avatar Icon */}
      {isAssistant && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center">
          <span className="text-xs">👶</span>
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-sm text-sm transition-all ${
          isAssistant
            ? 'bg-slate-800/90 text-slate-100 border border-slate-700/70 rounded-bl-xs'
            : 'bg-gradient-to-r from-rose-600 to-pink-500 text-white rounded-br-xs shadow-rose-600/20'
        }`}
      >
        {/* Role tag or Haan baby badge */}
        {isAssistant && (
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-700/50">
            <span className="text-[11px] font-bold text-rose-300 tracking-wide flex items-center gap-1">
              <span>Baby</span>
              {message.text.includes('Haan baby') && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] border border-rose-500/30">
                  Haan baby 😊
                </span>
              )}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onReplay(message)}
                title="Play voice"
                className={`p-1 rounded-md transition-colors ${
                  isCurrentlySpeaking
                    ? 'text-amber-400 bg-amber-400/20 animate-pulse'
                    : 'text-slate-400 hover:text-rose-300 hover:bg-slate-700'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                title="Copy text"
                className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Spoken / Message text */}
        <p className="whitespace-pre-line leading-relaxed text-[13.5px]">
          {message.text}
        </p>

        {/* Step-by-Step checklist if steps detected */}
        {message.interactiveSteps && message.interactiveSteps.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-slate-700/60 space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300/90 mb-1">
              Step-by-Step Guide
            </div>
            {message.interactiveSteps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-xs text-slate-200"
              >
                <span className="shrink-0 w-4 h-4 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Interactive Timer Widget (Real task utility!) */}
        {message.suggestedTimerMinutes && timerSecondsLeft !== null && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-amber-400/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <div>
                <div className="text-[10px] font-bold uppercase text-amber-300">
                  {timerSecondsLeft === 0 ? "Timer Done! 🎉" : "Active Timer"}
                </div>
                <div className="text-base font-extrabold font-mono text-white">
                  {formatTimer(timerSecondsLeft)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {timerSecondsLeft > 0 ? (
                <button
                  onClick={() => setTimerRunning(!timerRunning)}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                >
                  {timerRunning ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Start
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setTimerSecondsLeft(message.suggestedTimerMinutes! * 60);
                    setTimerRunning(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Restart
                </button>
              )}
            </div>
          </div>
        )}

        {/* Message timestamp */}
        <div
          className={`mt-1.5 text-[10px] text-right font-medium ${
            isAssistant ? 'text-slate-400' : 'text-rose-100/80'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
};
