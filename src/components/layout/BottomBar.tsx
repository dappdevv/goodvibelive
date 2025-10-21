'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function BottomBar() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('');
          setQuery(transcript);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          if (isListening) {
            recognitionInstance.start();
          } else {
            setIsListening(false);
          }
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // TODO: Send query to AI
      console.log('Query:', query);
      // Here we would typically send the query to an AI service
      // For now, we'll just clear the input after logging
      setQuery('');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <Input
            placeholder="Ask AI..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon="🔍"
            className="flex-1"
          />
          <Button
            variant="primary"
            size="icon"
            type="submit"
            disabled={!query.trim()}
          >
            ✈️
          </Button>
        </form>
        <Button
          variant={isListening ? "primary" : "icon"}
          size="icon"
          onClick={handleVoiceInput}
          className={isListening ? 'animate-pulse' : ''}
        >
          {isListening ? '🔴' : '🎤'}
        </Button>
      </div>
    </div>
  );
}
