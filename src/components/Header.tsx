import React from 'react';
import { Volume2, VolumeX, Globe, Trash2, Settings, Sparkles } from 'lucide-react';
import { AssistantSettings } from '../types';

interface HeaderProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => void;
  onClearChat: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onClearChat,
  onOpenSettings,
}) => {
  const toggleMute = () => {
    onUpdateSettings({ autoSpeak: !settings.autoSpeak });
  };

  const cycleLanguage = () => {
    const langs: AssistantSettings['language'][] = ['auto', 'hi-IN', 'en-IN'];
    const currentIndex = langs.indexOf(settings.language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    onUpdateSettings({ language: nextLang });
  };

  const getLanguageLabel = () => {
    switch (settings.language) {
      case 'hi-IN':
        return 'हिन्दी (Hindi)';
      case 'en-IN':
        return 'English / Hinglish';
      case 'en-US':
        return 'English';
      default:
        return 'Auto (Hindi/Eng)';
    }
  };

  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20 px-3 py-2.5 sm:px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-300 flex items-center justify-center shadow-sm">
            <span className="text-sm">👶</span>
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5 leading-none">
              Baby
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Voice AI
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              "Haan baby 😊" • Hindi & English
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Toggle Chip */}
          <button
            onClick={cycleLanguage}
            title="Switch Language"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Globe className="w-3 h-3 text-rose-400" />
            <span className="hidden xs:inline">{getLanguageLabel()}</span>
            <span className="xs:hidden">
              {settings.language === 'hi-IN' ? 'हिन्दी' : settings.language === 'en-IN' ? 'EN' : 'Auto'}
            </span>
          </button>

          {/* Audio Auto-Speak Toggle */}
          <button
            onClick={toggleMute}
            title={settings.autoSpeak ? "Auto-speak is ON (Tap to mute)" : "Auto-speak is OFF (Tap to enable voice)"}
            className={`p-1.5 rounded-lg border transition-all ${
              settings.autoSpeak
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {settings.autoSpeak ? (
              <Volume2 className="w-4 h-4 text-rose-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Clear Chat */}
          <button
            onClick={onClearChat}
            title="Clear Chat History"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            title="Settings & Info"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
