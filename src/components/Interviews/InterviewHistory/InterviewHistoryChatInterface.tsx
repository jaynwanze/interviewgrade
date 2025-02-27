'use client';

import { Button } from '@/components/ui/button';
import { Interview, InterviewEvaluation } from '@/types';
import { getAIResponse } from '@/utils/openai/getAIResponse';
import { useEffect, useMemo, useRef, useState } from 'react';

export const ChatInterface = ({
  interview,
  evaluation,
}: {
  interview: Interview;
  evaluation: InterviewEvaluation;
}) => {
  const [messages, setMessages] = useState<
    Array<{ sender: 'system' | 'user' | 'assistant'; text: string }>
  >([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generic sample prompts, randomized once on mount.
  const samplePrompts = useMemo(() => {
    const prompts = [
      "How can I improve my interview performance?",
      "What are common interview mistakes?",
      "What tips do you have for handling tough questions?",
      "How can I better showcase my skills?",
      "What are some common interview questions for this topic?",
      "How can I prepare better?",
      "What should I do to stand out?",
    ];
    // Randomize the array order.
    return prompts.sort(() => Math.random() - 0.5).slice(0, 3);
  }, []);
  // Updated handleSend accepts an optional text value.
  const handleSend = async (textToSend?: string) => {
    const text = textToSend ?? input;
    if (!text.trim()) return;

    // Add the user's message to the chat.
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    // If text was provided from a sample, clear the input if needed.
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      // Get the last 3 messages for context.
      const lastThreeMessages = messages.slice(-3);

      // Fetch AI response using the server action.
      const response = await getAIResponse(
        interview,
        evaluation,
        text,
        lastThreeMessages, // Pass the last 3 messages as context
      );

      // Add AI response to the chat.
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: response || 'No response' },
      ]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] rounded-lg shadow-lg border overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">AI Interview Coach</h2>
        <p className="text-sm text-gray-600">
          Ask any questions about your interview history or evaluation.
        </p>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    
      {/* Horizontal scrollable sample prompts */}
      <div className="px-4 py-2 border-t border-b border-gray-200 dark:border-gray-700 overflow-x-auto whitespace-nowrap">
        {samplePrompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleSend(prompt)}
            className="inline-block mr-2 mb-1"
          >
            {prompt}
          </Button>
        ))}
      </div>
      {/* Chat Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading}
            className="px-4 py-2 focus:outline-none focus:ring- disabled:opacity-50"
            variant="default"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
