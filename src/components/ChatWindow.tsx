import React, { useEffect, useRef } from 'react';
import { Message } from '../socket';
import { useGameStore } from '../store/gameStore';

interface ChatWindowProps {
  messages: Message[];
}

export function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { playerName } = useGameStore();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex-grow p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="text-gray-400 text-sm flex items-center justify-center h-full">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const isMe = message.playerName === playerName;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    isMe ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-white'
                  }`}
                >
                  {!isMe && (
                    <div className="text-xs font-medium opacity-70 mb-1">
                      {message.playerName}
                    </div>
                  )}
                  <div className="text-sm">{message.text}</div>
                  <div className="text-right text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}