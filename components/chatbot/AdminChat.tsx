'use client';

import React, { useState, useRef, useEffect } from 'react';
import { firebaseDb } from '@/lib/firebase/client';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  Timestamp,
  CollectionReference,
  DocumentData
} from 'firebase/firestore';
import { useAuthUser } from '@/lib/auth/useAuthUser';

interface AdminMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  isAdmin: boolean;
}

export default function AdminChat() {
  const { user, loading } = useAuthUser();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from Firebase
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const messagesRef = collection(firebaseDb, 'admin_chats', user.uid, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      unsubscribeRef.current = onSnapshot(
        q,
        (snapshot) => {
          const messageList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as AdminMessage));
          setMessages(messageList);
        },
        (error) => {
          console.error('Error loading messages:', error);
          setError('Không thể tải tin nhắn');
        }
      );

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    } catch (err) {
      console.error('Chat setup error:', err);
    }
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
      const messagesRef = collection(firebaseDb, 'admin_chats', user.uid, 'messages');
      console.log('Messages ref path:', messagesRef.path);
      
      const docRef = await addDoc(messagesRef, {
        userId: user.uid,
        userName: user.displayName || 'Guest',
        message: input,
        timestamp: Timestamp.now(),
        isAdmin: false,
      });

      console.log('Message sent successfully:', docRef.id);
      setInput('');
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-500">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-[600px] flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-600 mb-3">Vui lòng đăng nhập để chat với admin</p>
          <a href="/login" className="text-blue-500 hover:underline font-medium">
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-blue-50 to-white">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
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
                  ? 'bg-blue-100 text-gray-800 rounded-bl-none'
                  : 'bg-blue-500 text-white rounded-br-none'
              }`}
            >
              {msg.isAdmin && (
                <p className="text-xs font-semibold text-blue-600 mb-1">👨‍💼 Admin</p>
              )}
              <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
              <span
                className={`text-xs mt-1 block ${
                  msg.isAdmin ? 'text-gray-500' : 'text-blue-100'
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
            <div className="bg-blue-500 text-white px-4 py-3 rounded-lg rounded-br-none">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce delay-200"></div>
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
      <div className="border-t border-gray-200 bg-blue-50 px-4 py-2 text-xs text-gray-600 text-center">
        ✨ Admin sẽ trả lời trong giờ hành chính (8:00 - 20:00)
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            rows={2}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !input.trim()}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors font-medium text-sm"
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
