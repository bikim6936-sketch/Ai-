// Speech Recognition helper with graceful error handling and Android / Mobile support

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (errorMessage: string, isPermissionError: boolean) => void;
  onEnd?: () => void;
}

class SpeechManager {
  private recognition: any = null;
  private isListening = false;
  private selectedLanguage = 'auto'; // 'auto' | 'hi-IN' | 'en-IN' | 'en-US'
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private fallbackActive = false;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }

  public isSupported(): boolean {
    return Boolean(
      (typeof window !== 'undefined' &&
        ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  public setLanguage(lang: string) {
    this.selectedLanguage = lang;
  }

  public startListening(callbacks: SpeechRecognitionCallbacks) {
    if (this.isListening) {
      this.stopListening();
      return;
    }

    // Determine recognition language:
    // If auto, hi-IN or en-IN are the best for bilingual Indian context as Android Chrome speech recognizer handles Hindi + English mixed seamlessly in hi-IN/en-IN!
    let recogLang = 'hi-IN';
    if (this.selectedLanguage === 'en-US') {
      recogLang = 'en-US';
    } else if (this.selectedLanguage === 'en-IN') {
      recogLang = 'en-IN';
    } else if (this.selectedLanguage === 'hi-IN') {
      recogLang = 'hi-IN';
    } else {
      // 'auto': default to 'hi-IN' or 'en-IN' based on device language
      const userLang = navigator.language || '';
      recogLang = userLang.startsWith('en') ? 'en-IN' : 'hi-IN';
    }

    if (this.recognition) {
      this.recognition.lang = recogLang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.fallbackActive = false;
        callbacks.onStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          callbacks.onInterimResult?.(interim);
        }

        if (finalTranscript) {
          callbacks.onFinalResult?.(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        const errorType = event.error;

        if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
          callbacks.onError?.(
            "Microphone permission was denied. Please allow microphone access in your browser settings to talk to Baby! 🎙️",
            true
          );
        } else if (errorType === 'no-speech') {
          callbacks.onError?.("No speech detected. Tap the mic and try speaking closer to the phone!", false);
        } else if (errorType === 'network') {
          callbacks.onError?.("Network issue with voice recognition. Please check your connection or type below.", false);
        } else {
          callbacks.onError?.(`Speech error (${errorType}). You can also type your message!`, false);
        }

        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onEnd?.();
      };

      try {
        this.recognition.start();
        return;
      } catch (err: any) {
        console.warn('Failed to start standard speech recognition, trying MediaRecorder fallback:', err);
      }
    }

    // Fallback using MediaRecorder if SpeechRecognition failed or is unsupported
    this.startMediaRecorderFallback(callbacks);
  }

  private async startMediaRecorderFallback(callbacks: SpeechRecognitionCallbacks) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      callbacks.onError?.("Microphone is not supported in this browser. You can type to Baby!", false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.fallbackActive = true;
      this.isListening = true;
      callbacks.onStart?.();
      callbacks.onInterimResult?.("Listening... (Tap mic when done speaking)");

      this.audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.isListening = false;
        stream.getTracks().forEach((track) => track.stop());

        if (this.audioChunks.length === 0) {
          callbacks.onEnd?.();
          return;
        }

        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        callbacks.onInterimResult?.("Processing your voice with Gemini...");

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: audioBlob.type || 'audio/webm',
              }),
            });

            if (!response.ok) {
              throw new Error('Transcription failed');
            }

            const data = await response.json();
            if (data.transcript) {
              callbacks.onFinalResult?.(data.transcript);
            } else {
              callbacks.onError?.("Could not hear clearly. Try again?", false);
            }
            callbacks.onEnd?.();
          };
        } catch (e: any) {
          callbacks.onError?.("Voice transcription failed. Try again or type below.", false);
          callbacks.onEnd?.();
        }
      };

      this.mediaRecorder.start();
    } catch (err: any) {
      this.isListening = false;
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      callbacks.onError?.(
        isDenied
          ? "Microphone permission denied. Please allow microphone access in your browser to talk! 🎙️"
          : "Could not access microphone. Please check permissions.",
        isDenied
      );
      callbacks.onEnd?.();
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening && !this.fallbackActive) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // ignore
      }
    }

    this.isListening = false;
  }

  public getListening(): boolean {
    return this.isListening;
  }
}

export const speechManager = new SpeechManager();
