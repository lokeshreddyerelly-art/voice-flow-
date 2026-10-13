"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, AlertCircle } from "lucide-react";

interface VoiceInputButtonProps {
  onTranscriptChange: (transcript: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  className?: string;
}

export function VoiceInputButton({
  onTranscriptChange,
  isListening,
  setIsListening,
  className = "",
}: VoiceInputButtonProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Web Speech API availability in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        onTranscriptChange(currentTranscript.trim());
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone access was blocked. Please check browser permissions.");
        } else if (event.error === "no-speech") {
          // Soft timeout, user stopped talking
        } else {
          setErrorMessage(`Speech recognition alert: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition initialization failed:", e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [onTranscriptChange, setIsListening]);

  const toggleListening = () => {
    if (!isSupported) {
      setErrorMessage("Speech recognition is not natively supported in this browser. Please use keyboard text input.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current?.start();
      } catch (err: any) {
        console.warn("Start recognition error:", err);
        // If already started, stop and restart
        try {
          recognitionRef.current?.stop();
          setTimeout(() => recognitionRef.current?.start(), 200);
        } catch {
          setErrorMessage("Microphone is currently unavailable.");
        }
      }
    }
  };

  return (
    <div className="relative inline-flex flex-col items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={
          isSupported
            ? isListening
              ? "Click to stop listening"
              : "Speak your task with Voice Input"
            : "Voice input not supported in this browser"
        }
        className={`relative flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
          isListening
            ? "bg-red-500 text-white mic-active shadow-lg shadow-red-500/30 scale-105"
            : "bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700/80 hover:border-indigo-500 shadow-md"
        } ${className}`}
      >
        {isListening ? (
          <Mic className="w-5 h-5 animate-pulse text-white" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {/* Listening indicator wave */}
      {isListening && (
        <div className="absolute -bottom-8 flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800 text-red-300 text-[11px] font-medium animate-pulse whitespace-nowrap shadow-lg">
          <Volume2 className="w-3.5 h-3.5 text-red-400 animate-bounce" />
          <span>Listening... Speak your task</span>
        </div>
      )}

      {/* Error notification message */}
      {errorMessage && (
        <div className="absolute top-12 z-20 w-64 p-2.5 rounded-lg bg-amber-950/90 border border-amber-800 text-amber-200 text-xs shadow-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p>{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[10px] text-amber-400 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
