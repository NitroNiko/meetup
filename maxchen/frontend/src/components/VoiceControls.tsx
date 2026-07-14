import { useMemo, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

interface VoiceControlsProps {
  disabled?: boolean;
  onTranscript: (text: string) => void;
  onListeningChange: (listening: boolean) => void;
}

export function VoiceControls({ disabled, onTranscript, onListeningChange }: VoiceControlsProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const supported = useMemo(() => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  }, []);

  function toggleListening() {
    if (!supported || disabled) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const finalResult = Array.from(event.results).find((result) => result.isFinal) ?? event.results[0];
      onTranscript(finalResult[0].transcript);
    };
    recognition.onend = () => {
      setListening(false);
      onListeningChange(false);
    };
    recognitionRef.current = recognition;
    setListening(true);
    onListeningChange(true);
    recognition.start();
  }

  return (
    <div className="voice-controls">
      <button type="button" onClick={toggleListening} disabled={!supported || disabled} className={listening ? "recording" : ""}>
        {listening ? "Aufnahme stoppen" : "Mit Mäxchen sprechen"}
      </button>
      <small>{supported ? "Web Speech API aktiv" : "Browser unterstützt SpeechRecognition nicht"}</small>
    </div>
  );
}

export function speak(text: string, onStart: () => void, onEnd: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = 0.96;
  utterance.pitch = 0.9;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

