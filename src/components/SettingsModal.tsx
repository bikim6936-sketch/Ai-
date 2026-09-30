import React from 'react';
import { X, Volume2, Globe, Sliders, Smartphone, Check, Play } from 'lucide-react';
import { AssistantSettings } from '../types';
import { audioPlayer } from '../utils/audioPlayer';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const testVoice = () => {
    audioPlayer.stop();
    audioPlayer.playBrowserTTS('Haan baby 😊! Main bilkul theek hoon, aap batao kaise ho?', {
      pitch: settings.voicePitch,
      rate: settings.voiceSpeed,
      lang: settings.language === 'auto' ? 'hi-IN' : settings.language,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white">Voice & App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-5 text-sm">
          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50">
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-rose-400" />
                Read Responses Aloud
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Baby automatically speaks each response
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => onUpdateSettings({ autoSpeak: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
            </label>
          </div>

          {/* Voice Language Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              Primary Language
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'auto', label: 'Auto (Detect)', sub: 'Hindi + English' },
                { id: 'hi-IN', label: 'हिन्दी', sub: 'Hindi & Hinglish' },
                { id: 'en-IN', label: 'English', sub: 'Indian / Global' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() =>
                    onUpdateSettings({
                      language: lang.id as AssistantSettings['language'],
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    settings.language === lang.id
                      ? 'bg-rose-500/20 border-rose-500/80 text-rose-200 shadow-sm'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold text-xs">{lang.label}</span>
                  <span className="text-[10px] text-slate-400">{lang.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Pitch */}
          <div className="space-y-2 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Voice Pitch (Cuteneess level)
              </span>
              <span className="font-mono text-rose-400 font-bold">
                {settings.voicePitch.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.9"
              max="1.45"
              step="0.05"
              value={settings.voicePitch}
              onChange={(e) =>
                onUpdateSettings({ voicePitch: parseFloat(e.target.value) })
              }
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Warm & Calm</span>
              <span>Cute & Sweet (Default)</span>
              <span>Ultra Playful</span>
            </div>
          </div>

          {/* Voice Speed */}
          <div className="space-y-2 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">Speaking Speed</span>
              <span className="font-mono text-rose-400 font-bold">
                {settings.voiceSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              value={settings.voiceSpeed}
              onChange={(e) =>
                onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })
              }
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Test Voice Button */}
          <button
            onClick={testVoice}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-rose-300" />
            Test Baby Voice ("Haan baby 😊")
          </button>

          {/* Mobile Android Tips */}
          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Android Mobile Web Usage
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              For best experience on Android phones, open in Google Chrome. Tap the <strong>three dots menu (⋮)</strong> and select <strong>"Add to Home screen"</strong>. You can then launch Baby full-screen like a native voice app!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
