class AudioPlayerManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlayingState = false;
  private onStateChange: ((isPlaying: boolean) => void) | null = null;

  public setListener(cb: (isPlaying: boolean) => void) {
    this.onStateChange = cb;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
      this.currentUtterance = null;
    }

    if (this.isPlayingState) {
      this.isPlayingState = false;
      this.onStateChange?.(false);
    }
  }

  /**
   * Play speech using base64 WAV (from Gemini TTS) or fallback to Web Speech Synthesis
   */
  public async play(
    text: string,
    audioBase64?: string | null,
    options?: { pitch?: number; rate?: number; lang?: string }
  ): Promise<void> {
    this.stop();

    // 1. Try Gemini high-fidelity Studio Voice (base64 WAV)
    if (audioBase64) {
      try {
        const audioSrc = `data:audio/wav;base64,${audioBase64}`;
        const audio = new Audio(audioSrc);
        this.currentAudio = audio;

        this.isPlayingState = true;
        this.onStateChange?.(true);

        return new Promise<void>((resolve) => {
          audio.onended = () => {
            this.isPlayingState = false;
            this.onStateChange?.(false);
            this.currentAudio = null;
            resolve();
          };

          audio.onerror = () => {
            console.warn("Studio voice playback failed, falling back to Web Speech Synthesis");
            this.currentAudio = null;
            this.playBrowserTTS(text, options).then(resolve);
          };

          audio.play().catch((err) => {
            console.warn("Audio autoplay blocked or failed, fallback to Web Speech Synthesis:", err);
            this.playBrowserTTS(text, options).then(resolve);
          });
        });
      } catch (err) {
        console.warn("Audio element error, falling back to Web Speech:", err);
      }
    }

    // 2. Fallback to Web Speech Synthesis
    return this.playBrowserTTS(text, options);
  }

  public playBrowserTTS(
    text: string,
    options?: { pitch?: number; rate?: number; lang?: string }
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        this.isPlayingState = false;
        this.onStateChange?.(false);
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();

        // Sanitize text for speech: clean out markdown formatting and multiple emojis
        const cleanText = text
          .replace(/[*#_`~]/g, '')
          .replace(/[✨🌸💖☀️🎉👍🔥]/g, '')
          .trim();

        if (!cleanText) {
          this.isPlayingState = false;
          this.onStateChange?.(false);
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        this.currentUtterance = utterance;

        // Cute sweet voice parameters
        utterance.pitch = options?.pitch ?? 1.25; // cute slightly higher friendly pitch
        utterance.rate = options?.rate ?? 1.05;   // lively natural pace

        // Language matching
        if (options?.lang && options.lang !== 'auto') {
          utterance.lang = options.lang;
        } else {
          // Detect if text has Hindi characters or common Hinglish words
          const hasHindiChar = /[\u0900-\u097F]/.test(cleanText);
          const hasHinglish = /\b(haan|nahi|kya|kaise|suno|accha|theek|bhai|yaar|kar|rahi|raha|hain|hai)\b/i.test(cleanText);
          if (hasHindiChar) {
            utterance.lang = 'hi-IN';
          } else if (hasHinglish) {
            utterance.lang = 'hi-IN'; // Android Chrome handles romanized Hindi wonderfully with hi-IN voice!
          } else {
            utterance.lang = 'en-IN';
          }
        }

        // Try to pick a natural female Indian or cute English voice
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(
            (v) =>
              (v.lang.startsWith('hi') || v.lang.startsWith('en-IN') || v.name.toLowerCase().includes('india')) &&
              (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google'))
          ) || voices.find(
            (v) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira')
          ) || voices.find((v) => v.lang.startsWith('hi') || v.lang.startsWith('en'));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        utterance.onstart = () => {
          this.isPlayingState = true;
          this.onStateChange?.(true);
        };

        utterance.onend = () => {
          this.isPlayingState = false;
          this.onStateChange?.(false);
          this.currentUtterance = null;
          resolve();
        };

        utterance.onerror = () => {
          this.isPlayingState = false;
          this.onStateChange?.(false);
          this.currentUtterance = null;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("SpeechSynthesis error:", err);
        this.isPlayingState = false;
        this.onStateChange?.(false);
        resolve();
      }
    });
  }
}

export const audioPlayer = new AudioPlayerManager();
