import React from 'react';
import { VoiceState } from '../types';
import { Sparkles, Heart } from 'lucide-react';

interface BabyAvatarProps {
  voiceState: VoiceState;
  onClick?: () => void;
  statusText?: string;
}

export const BabyAvatar: React.FC<BabyAvatarProps> = ({
  voiceState,
  onClick,
  statusText,
}) => {
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isThinking = voiceState === 'thinking';

  return (
    <div className="flex flex-col items-center justify-center select-none py-2">
      <div
        onClick={onClick}
        className="relative group cursor-pointer flex items-center justify-center transition-transform active:scale-95"
        role="button"
        aria-label="Baby Assistant Avatar"
      >
        {/* Outer Glow Halo Rings */}
        <div
          className={`absolute rounded-full transition-all duration-700 pointer-events-none ${
            isListening
              ? 'w-44 h-44 bg-rose-500/25 blur-xl animate-pulse-ring'
              : isSpeaking
              ? 'w-44 h-44 bg-amber-400/25 blur-xl animate-pulse-ring'
              : isThinking
              ? 'w-40 h-40 bg-purple-500/25 blur-xl animate-spin'
              : 'w-36 h-36 bg-rose-500/15 blur-lg'
          }`}
        />

        {/* Ambient Ring */}
        <div
          className={`absolute rounded-full border-2 transition-all duration-500 ${
            isListening
              ? 'w-36 h-36 border-rose-400/60 scale-110'
              : isSpeaking
              ? 'w-36 h-36 border-amber-400/60 scale-105'
              : isThinking
              ? 'w-32 h-32 border-purple-400/60 border-dashed animate-spin'
              : 'w-32 h-32 border-rose-300/30'
          }`}
        />

        {/* Main Avatar Orb */}
        <div
          className={`relative w-28 h-28 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 ring-4 ring-rose-400/50 shadow-rose-500/50 scale-105'
              : isSpeaking
              ? 'bg-gradient-to-tr from-amber-400 via-rose-400 to-pink-300 ring-4 ring-amber-300/50 shadow-amber-400/40 animate-float-slow'
              : isThinking
              ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-rose-400 ring-4 ring-purple-300/40 shadow-purple-500/40'
              : 'bg-gradient-to-tr from-rose-500 via-pink-400 to-amber-200 ring-4 ring-white/20 shadow-pink-500/30 animate-float-slow'
          }`}
        >
          {/* Cute Face SVG inside */}
          <svg
            viewBox="0 0 100 100"
            className="w-24 h-24 transition-transform duration-300 drop-shadow-sm"
          >
            {/* Blushing Cheeks */}
            <circle
              cx="26"
              cy="58"
              r="7"
              className={`transition-all duration-300 ${
                isListening || isSpeaking
                  ? 'fill-rose-700/60 scale-125'
                  : 'fill-rose-600/40'
              }`}
            />
            <circle
              cx="74"
              cy="58"
              r="7"
              className={`transition-all duration-300 ${
                isListening || isSpeaking
                  ? 'fill-rose-700/60 scale-125'
                  : 'fill-rose-600/40'
              }`}
            />

            {/* Sparkle highlight in cheek */}
            <circle cx="24" cy="56" r="1.5" fill="#fff" opacity="0.8" />
            <circle cx="72" cy="56" r="1.5" fill="#fff" opacity="0.8" />

            {/* Left Eye */}
            <g className={!isThinking ? "animate-blink origin-[36px_44px]" : ""}>
              <ellipse
                cx="36"
                cy="44"
                rx={isListening ? "5.5" : "5"}
                ry={isListening ? "6.5" : "5.5"}
                fill="#1e1b4b"
              />
              {/* Eye sparkle highlights */}
              <circle cx="34" cy="42" r="2" fill="#ffffff" />
              <circle cx="38" cy="46" r="0.9" fill="#ffffff" />
            </g>

            {/* Right Eye */}
            <g className={!isThinking ? "animate-blink origin-[64px_44px]" : ""}>
              <ellipse
                cx="64"
                cy="44"
                rx={isListening ? "5.5" : "5"}
                ry={isListening ? "6.5" : "5.5"}
                fill="#1e1b4b"
              />
              {/* Eye sparkle highlights */}
              <circle cx="62" cy="42" r="2" fill="#ffffff" />
              <circle cx="66" cy="46" r="0.9" fill="#ffffff" />
            </g>

            {/* Cute Mouth */}
            {isSpeaking ? (
              // Animated open talking mouth
              <g className="origin-[50px_64px] animate-pulse">
                <path
                  d="M 43 62 Q 50 72 57 62 Z"
                  fill="#7f1d1d"
                  stroke="#1e1b4b"
                  strokeWidth="1.5"
                />
                {/* Cute tongue */}
                <path
                  d="M 46 66 Q 50 63 54 66 Q 50 71 46 66 Z"
                  fill="#f43f5e"
                />
              </g>
            ) : isListening ? (
              // Happy attentive little open 'o'
              <ellipse
                cx="50"
                cy="62"
                rx="3.5"
                ry="4.5"
                fill="#7f1d1d"
                stroke="#1e1b4b"
                strokeWidth="1"
              />
            ) : isThinking ? (
              // Cute curious tilted mouth
              <path
                d="M 44 63 Q 50 60 56 64"
                fill="transparent"
                stroke="#1e1b4b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : (
              // Sweet gentle warm smile
              <path
                d="M 42 61 Q 50 69 58 61"
                fill="transparent"
                stroke="#1e1b4b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Floating cute heart or sparkles icon indicator */}
          <div className="absolute -top-1 -right-1 bg-white text-rose-500 p-1 rounded-full shadow-md border border-rose-100 flex items-center justify-center">
            {isListening ? (
              <Heart className="w-3.5 h-3.5 fill-rose-500 animate-ping" />
            ) : isSpeaking ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            ) : (
              <Heart className="w-3.5 h-3.5 fill-rose-500" />
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Status / Badge */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all shadow-sm ${
            isListening
              ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse'
              : isSpeaking
              ? 'bg-amber-400 text-slate-900 shadow-amber-400/30'
              : isThinking
              ? 'bg-purple-600 text-white shadow-purple-600/30'
              : 'bg-slate-800 text-rose-300 border border-slate-700/60'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isListening
                ? 'bg-white animate-ping'
                : isSpeaking
                ? 'bg-slate-900'
                : isThinking
                ? 'bg-white animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          {statusText ||
            (isListening
              ? 'Listening to you... 🎙️'
              : isSpeaking
              ? 'Speaking... 🔊'
              : isThinking
              ? 'Thinking... ✨'
              : 'Baby is ready 💖')}
        </div>
      </div>
    </div>
  );
};
