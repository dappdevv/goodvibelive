'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function BottomBar() {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // TODO: Implement Web Speech API
  };

  const handleSubmit = () => {
    // TODO: Send query to AI
    console.log('Query:', query);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <div className="max-w-2xl mx-auto flex items-center gap-2">
        <Input
          placeholder="Ask AI"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          icon="search"
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleVoiceInput}
          className={isListening ? 'text-red-500' : ''}
        >
          🎤
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSubmit}
        >
          ✈️
        </Button>
      </div>
    </div>
  );
}
