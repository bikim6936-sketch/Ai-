import React from 'react';
import { Mic, Square, X } from 'lucide-react';

interface ListeningIndicatorProps {
  interimTranscript: string;
  onStop: () => void;
  onCancel: () => void;
  selectedLanguage: string;
}

export const ListeningIndicator: React.FC<ListeningIndicatorProps> = ({
  interimTranscript,
  onStop,
  onCancel,
  selectedLanguage,
}) => {
  return (
    <div className="w-full max-w-md mx-auto p-4 rounded-2xl bg-gradient-to-b from-rose-950/80 to-slate-900/90 border border-rose-500/40 shadow-xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Microphone Active
          </span>
        </div>

        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          title="Cancel listening"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dynamic Sound Waveform Bars */}
      <div className="flex items-center justify-center gap-1.5 h-12 my-2 py-1">
        {[24, 40, 16, 44, 30, 48, 20, 36, 48, 28, 44, 18, 38].map((h, i) => (
          <span
            key={i}
            className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 via-pink-400 to-amber-300 animate-pulse"
            style={{
              height: `${Math.max(10, (h * (interimTranscript ? 1.1 : 0.6)))}px`,
              animationDelay: `${(i % 5) * 120}ms`,
              animationDuration: '650ms',
            }}
          />
        ))}
      </div>

      {/* Live Hearing Transcript */}
      <div className="min-h-[44px] flex items-center justify-center text-center px-3 py-2 bg-slate-950/60 rounded-xl border border-rose-500/20">
        {interimTranscript ? (
          <p className="text-sm font-semibold text-rose-100 italic">
            "{interimTranscript}"
          </p>
        ) : (
          <p className="text-xs text-rose-300/80 animate-pulse">
            Baby is listening... speak in Hindi, Hinglish, or English!
          </p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400 truncate">
          Tip: Say <strong className="text-rose-300">"Baby"</strong> to hear <strong className="text-rose-300">"Haan baby 😊"</strong>
        </span>

        <button
          onClick={onStop}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95"
        >
          <Square className="w-3 h-3 fill-white" />
          Done Speaking
        </button>
      </div>
    </div>
  );
};
