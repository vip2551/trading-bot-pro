"use client";

import { useCallback, useRef, useEffect } from "react";

export type SoundType = 
  | "trade_open"
  | "trade_close"
  | "trade_win"
  | "trade_loss"
  | "alert"
  | "error"
  | "notification"
  | "success"
  | "warning";

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
  trade_open: { frequency: 523.25, duration: 200, type: "sine", volume: 0.3 }, // C5
  trade_close: { frequency: 392.00, duration: 300, type: "sine", volume: 0.3 }, // G4
  trade_win: { frequency: 659.25, duration: 400, type: "sine", volume: 0.4 }, // E5 - positive sound
  trade_loss: { frequency: 293.66, duration: 500, type: "sine", volume: 0.3 }, // D4 - lower tone
  alert: { frequency: 880.00, duration: 150, type: "square", volume: 0.2 }, // A5 - attention
  error: { frequency: 220.00, duration: 600, type: "sawtooth", volume: 0.25 }, // A3 - harsh
  notification: { frequency: 440.00, duration: 200, type: "sine", volume: 0.2 }, // A4
  success: { frequency: 783.99, duration: 250, type: "sine", volume: 0.35 }, // G5
  warning: { frequency: 587.33, duration: 350, type: "triangle", volume: 0.25 }, // D5
};

// Arabic voice announcements (using Web Speech API)
const ARABIC_ANNOUNCEMENTS: Record<SoundType, string> = {
  trade_open: "تم فتح صفقة جديدة",
  trade_close: "تم إغلاق الصفقة",
  trade_win: "صفقة رابحة",
  trade_loss: "صفقة خاسرة",
  alert: "تنبيه",
  error: "خطأ",
  notification: "إشعار",
  success: "تم بنجاح",
  warning: "تحذير",
};

// English voice announcements
const ENGLISH_ANNOUNCEMENTS: Record<SoundType, string> = {
  trade_open: "Trade opened",
  trade_close: "Trade closed",
  trade_win: "Winning trade",
  trade_loss: "Losing trade",
  alert: "Alert",
  error: "Error",
  notification: "Notification",
  success: "Success",
  warning: "Warning",
};

export function useSoundNotifications() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext on first use (requires user interaction)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a sound
  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getAudioContext();
      const config = SOUND_CONFIGS[type];
      
      // Create oscillator
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, ctx.currentTime);
      
      // Envelope
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration / 1000);
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + config.duration / 1000);

      // For trade_win, play a chord
      if (type === "trade_win") {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain2.gain.setValueAtTime(0, ctx.currentTime);
        gain2.gain.linearRampToValueAtTime(config.volume * 0.7, ctx.currentTime + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration / 1000);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + config.duration / 1000 + 0.1);
      }

      // For trade_loss, play descending tone
      if (type === "trade_loss") {
        oscillator.frequency.linearRampToValueAtTime(220, ctx.currentTime + config.duration / 1000);
      }

    } catch (e) {
      console.error("Failed to play sound:", e);
    }
  }, [getAudioContext]);

  // Voice announcement
  const speak = useCallback((type: SoundType, lang: "en" | "ar" = "en") => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported");
      return;
    }

    const text = lang === "ar" ? ARABIC_ANNOUNCEMENTS[type] : ENGLISH_ANNOUNCEMENTS[type];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "ar" ? "ar-SA" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    // Try to find appropriate voice
    const voices = speechSynthesis.getVoices();
    const targetLang = lang === "ar" ? "ar" : "en";
    const voice = voices.find(v => v.lang.startsWith(targetLang));
    if (voice) {
      utterance.voice = voice;
    }

    speechSynthesis.speak(utterance);
  }, []);

  // Combined notification (sound + optional voice)
  const notify = useCallback((
    type: SoundType, 
    options?: { 
      speak?: boolean; 
      lang?: "en" | "ar";
      customMessage?: string;
    }
  ) => {
    playSound(type);
    
    if (options?.speak) {
      if (options.customMessage) {
        const utterance = new SpeechSynthesisUtterance(options.customMessage);
        utterance.lang = options.lang === "ar" ? "ar-SA" : "en-US";
        utterance.rate = 1.0;
        speechSynthesis.speak(utterance);
      } else {
        speak(type, options.lang || "en");
      }
    }
  }, [playSound, speak]);

  // Play a custom melody (for special events)
  const playMelody = useCallback((notes: { freq: number; duration: number }[]) => {
    try {
      const ctx = getAudioContext();
      let time = ctx.currentTime;

      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(note.freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + note.duration / 1000);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + note.duration / 1000);
        
        time += note.duration / 1000;
      });
    } catch (e) {
      console.error("Failed to play melody:", e);
    }
  }, [getAudioContext]);

  // Victory fanfare (for big wins)
  const playVictoryFanfare = useCallback(() => {
    playMelody([
      { freq: 523.25, duration: 150 }, // C5
      { freq: 659.25, duration: 150 }, // E5
      { freq: 783.99, duration: 150 }, // G5
      { freq: 1046.50, duration: 400 }, // C6
    ]);
  }, [playMelody]);

  // Clean up
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    speak,
    notify,
    playMelody,
    playVictoryFanfare,
  };
}

// Sound Settings Component
export const soundSettings = {
  enabled: true,
  volume: 0.5,
  tradeSounds: true,
  alertSounds: true,
  voiceAnnouncements: false,
  language: "en" as "en" | "ar",
};
