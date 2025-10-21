'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { feedApi } from '@/lib/api/feed';
import { apiClient } from '@/lib/api/client';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function BottomBar() {
  const [query, setQuery] = useState('');
 const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const interimTranscriptRef = useRef('');

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
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const result = event.results[i];
            if (result.isFinal) {
              setQuery(prevQuery => prevQuery + result[0].transcript);
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          interimTranscriptRef.current = interimTranscript;
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          setIsProcessingAudio(false);
          setError(`Speech recognition error: ${event.error}`);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
          setIsProcessingAudio(false);
          if (interimTranscriptRef.current) {
            setQuery(prevQuery => prevQuery + interimTranscriptRef.current);
            interimTranscriptRef.current = '';
          }
        };

        setRecognition(recognitionInstance);
      } else {
        setError('Speech recognition is not supported in your browser');
      }
    }
  }, []);

  const handleVoiceInput = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsProcessingAudio(true); // Show that we're processing the audio
    } else {
      setQuery(''); // Clear previous query when starting new voice input
      recognition.start();
      setIsListening(true);
      setIsProcessingAudio(true);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      try {
        // Determine if this is an AI search request or a message to send
        // For now, we'll treat all text as search queries, but in the future
        // we could differentiate based on context or a specific command
        const result = await feedApi.getFeed({
          limit: 20,
          offset: 0,
          tags: [query.trim()] // Using tags as a simple search mechanism
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        console.log('Search results:', result.data);
        // Here we would typically update the feed with the search results
        // For now, we'll just clear the input after logging
        setQuery('');
      } catch (err) {
        console.error('Error during search:', err);
        setError(err instanceof Error ? err.message : 'An error occurred during search');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Function to send a message to the AI
  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // This would be the actual API call to send a message to the AI
      // For now, we'll use the feed API for search functionality
      const result = await feedApi.getFeed({
        limit: 20,
        offset: 0,
        tags: [message.trim()]
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      console.log('Message response:', result.data);
      // Here we would typically update the chat UI with the response
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while sending the message');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit if voice input produces a query and we're processing audio
  useEffect(() => {
    if (isProcessingAudio && query.trim() && !isListening) {
      setIsProcessingAudio(false);
      // Submit the voice-generated query automatically
      handleSubmit(new Event('submit') as unknown as React.FormEvent);
    }
 }, [query, isProcessingAudio, isListening]);

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
            disabled={isLoading || isProcessingAudio}
          />
          <Button
            variant="primary"
            size="icon"
            type="submit"
            disabled={!query.trim() || isLoading || isProcessingAudio}
          >
            {isLoading || isProcessingAudio ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            ) : '✈️'}
          </Button>
        </form>
        <Button
          variant={isListening ? "primary" : "icon"}
          size="icon"
          onClick={handleVoiceInput}
          className={isListening ? 'animate-pulse' : ''}
          disabled={isLoading}
        >
          {isListening || isProcessingAudio ? '🔴' : '🎤'}
        </Button>
      </div>
      {error && (
        <div className="max-w-2xl mx-auto mt-2 p-2 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}
      {(isLoading || isProcessingAudio) && (
        <div className="max-w-2xl mx-auto mt-1 text-center text-xs text-gray-500">
          {isProcessingAudio ? 'Processing your voice input...' : 'Loading...'}
        </div>
      )}
    </div>
  );
}
