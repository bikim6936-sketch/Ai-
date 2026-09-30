import React from 'react';

interface QuickPromptsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled: boolean;
}

const PROMPTS = [
  { label: 'Baby! 👋', text: 'Baby!' },
  { label: 'Ek joke sunao 😄', text: 'Baby, ek cute aur funny joke sunao na!' },
  { label: '5 min timer ⏱️', text: 'Baby, 5 minute ka timer lagao study ke liye' },
  { label: 'Chai recipe ☕', text: 'Kadak chai banane ka step-by-step tareeka batao' },
  { label: 'Cheer me up 💖', text: 'Baby, aaj thoda tired feel ho raha hai, cheer me up!' },
  { label: 'Daily Routine 📋', text: 'Mera productive daily routine plan karne mein help karo' },
  { label: 'Say something in English ✨', text: 'Tell me 3 easy steps to stay positive today' },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({
  onSelectPrompt,
  disabled,
}) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-1 px-1">
      <div className="flex items-center gap-2 min-w-max">
        {PROMPTS.map((p, idx) => (
          <button
            key={idx}
            disabled={disabled}
            onClick={() => onSelectPrompt(p.text)}
            className="px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/90 active:bg-rose-600/30 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-semibold shadow-xs transition-all whitespace-nowrap disabled:opacity-50 active:scale-95 flex items-center gap-1"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};
