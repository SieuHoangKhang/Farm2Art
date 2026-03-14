'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

interface AdminMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string | number;
  isAdmin: boolean;
}

interface AdminChatProps {
  onClose?: () => void;
}

export default function AdminChat({ onClose }: AdminChatProps) {
  const { user, loading } = useAuthUser();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for messages from the server
  const fetchMessages = async () => {
    if (!user?.uid) return;
    try {
      const response = await fetch(`/api/admin-chat?userId=${user.uid}`, {
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        const msgs = (data.messages || []) as AdminMessage[];
        // Sort by timestamp ascending
        msgs.sort((a, b) => {
          const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
          const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
          return timeA - timeB;
        });
        setMessages(msgs);
      }
    } catch (err: any) {
      console.error('Fetch messages error:', err);
    }
  };

  // Load initial messages and set up polling
  useEffect(() => {
    if (!user?.uid) return;

    fetchMessages();

    // Poll every 3 seconds for new messages
    pollIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user?.uid]);

  const handleSendMessage = async () => {
    if (!input.trim() || !user?.uid) {
      setError('Vui lòng đăng nhập và nhập tin nhắn');
      return;
    }

    setIsSending(true);
    setError('');

    try {
      console.log('Sending message for user:', user.uid);

      // Send to API
      const response = await fetch('/api/admin-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.displayName || 'Guest',
          message: input,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = await response.json();
      console.log('Message sent successfully:', data.messageId);

      setInput('');

      // Refresh messages immediately to see the sent message
      setTimeout(() => {
        fetchMessages();
      }, 500);
    } catch (err: any) {
      console.error('Send message error:', err);
      const errorMsg = err?.message || 'Không thể gửi tin nhắn';
      setError(`Lỗi: ${errorMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <p className="text-sm text-stone-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-stone-500 mb-3">Vui lòng đăng nhập để chat với admin</p>
          <a href="/login" className="text-emerald-500 hover:underline font-medium">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-white">

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-emerald-50 to-white">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-stone-400">
              <p className="text-lg mb-2">👋 Xin chào {user.displayName || 'bạn'}!</p>
              <p className="text-sm">Bắt đầu cuộc trò chuyện với admin</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-xs px-4 py-3 rounded-lg ${
                msg.isAdmin
                  ? 'bg-emerald-100 text-stone-700 rounded-bl-none'
                  : 'bg-emerald-500 text-white rounded-br-none'
              }`}
            >
              {msg.isAdmin && (
                <p className="text-xs font-semibold text-emerald-600 mb-1">👨‍💼 Admin</p>
              )}
              <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
              <span
                className={`text-xs mt-1 block ${
                  msg.isAdmin ? 'text-stone-400' : 'text-emerald-100'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-end">
            <div className="bg-emerald-500 text-white px-4 py-3 rounded-lg rounded-br-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-emerald-200 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-emerald-200 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-emerald-200 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-300">
            ❌ {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Status Bar */}
      <div className="border-t border-sage-200 bg-emerald-50 px-4 py-2 text-xs text-stone-500 text-center">
        Admin sẽ trả lời trong giờ hành chính (8:00 - 20:00)
      </div>

      {/* Input Area */}
      <div className="border-t border-sage-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 p-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
            rows={2}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !input.trim()}
            className="px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 transition-colors font-medium text-sm"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
