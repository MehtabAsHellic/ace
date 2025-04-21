import React, { useEffect, useRef, useState } from 'react';
import { MessageType } from '../types/Message';
import { Send } from 'lucide-react';

interface ChatBoxProps {
  messages: MessageType[];
  sendMessage: (message: string) => void;
  username: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, sendMessage, username }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-gray-700 rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`max-w-3/4 p-3 rounded-lg ${
                  msg.username === username 
                    ? 'ml-auto bg-blue-600 text-white' 
                    : 'bg-gray-600 text-white'
                }`}
              >
                <div className="font-medium text-xs mb-1">
                  {msg.username === username ? 'You' : msg.username}
                </div>
                <div>{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-3 rounded-l bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 rounded-r px-4 transition duration-200 flex items-center justify-center"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};