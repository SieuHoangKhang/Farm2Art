'use client';

import React, { useState } from 'react';
import ChatSelector from './ChatSelector';
import AdminDashboard from './AdminDashboard';
import { useAuthUser } from '@/lib/auth/useAuthUser';

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { role, loading } = useAuthUser();

  // Don't show if loading
  if (loading) return null;

  // If admin, show admin dashboard button
  if (role === 'admin') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
          aria-label="Admin Dashboard"
          title="Quản lý tin nhắn"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </button>

        {isOpen && <AdminDashboard onClose={() => setIsOpen(false)} />}
      </>
    );
  }

  // Regular user - show chat selector
  return (
    <>
      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40"
        aria-label="Open chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {/* Chat Selector Modal */}
      {isOpen && <ChatSelector onClose={() => setIsOpen(false)} />}
    </>
  );
}
