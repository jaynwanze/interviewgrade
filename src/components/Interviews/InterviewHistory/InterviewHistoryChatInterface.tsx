'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const ChatInterface = ({ interviewId }) => {
  const [messages, setMessages] = useState<
    Array<{ sender: string; text: string }>
  >([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message to the chat
    setMessages((prev) => [...prev, { sender: 'user', text: input }]);
    setInput('');

    // Fetch AI response
    const response = await fetchAIResponse(interviewId, input);
    setMessages((prev) => [...prev, { sender: 'ai', text: response }]);
  };

  return (
    <div className="flex flex-col h-[500px] rounded-lg shadow-lg border overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t">
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
            onClick={handleSend}
            className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            variant="default"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
