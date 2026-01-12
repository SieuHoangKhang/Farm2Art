'use client';

import React, { useState } from 'react';
import ChatBot from './ChatBot';
import AdminChat from './AdminChat';

type ChatMode = 'ai' | 'admin' | null;

interface ChatSelectorProps {
  onClose: () => void;
}

export default function ChatSelector({ onClose }: ChatSelectorProps) {
  const [mode, setMode] = useState<ChatMode>(null);

  if (mode === 'ai') {
    return (
      <div className="fixed bottom-24 right-6 w-full max-w-md h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center bg-green-500 text-white p-4 rounded-t-lg">
          <h2 className="font-semibold">🤖 Chat với AI</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMode(null)}
              className="hover:bg-green-600 p-1 rounded transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="hover:bg-green-600 p-1 rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatBot />
        </div>
      </div>
    );
  }

  if (mode === 'admin') {
    return (
      <div className="fixed bottom-24 right-6 w-full max-w-md h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center bg-blue-500 text-white p-4 rounded-t-lg">
          <h2 className="font-semibold">👨‍💼 Chat với Admin</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMode(null)}
              className="hover:bg-blue-600 p-1 rounded transition-colors"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="hover:bg-blue-600 p-1 rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          <AdminChat />
        </div>
      </div>
    );
  }

  // Selection View
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-24 right-6 w-full max-w-sm bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">Chọn hình thức chat</h2>
            <button
              onClick={onClose}
              className="hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="p-4 space-y-3">
          {/* AI Chat Option */}
          <button
            onClick={() => setMode('ai')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl mt-1">🤖</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 group-hover:text-green-600">
                  Chat với AI
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-green-600">
                  Hỏi đáp tức thì về sản phẩm, dịch vụ, thanh toán...
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 mt-1">
                <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 11H4v2h8.17l-3.59 3.59z" />
              </svg>
            </div>
          </button>

          {/* Admin Chat Option */}
          <button
            onClick={() => setMode('admin')}
            className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl mt-1">👨‍💼</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">
                  Chat với Admin
                </h3>
                <p className="text-sm text-gray-600 group-hover:text-blue-600">
                  Liên hệ trực tiếp với đội hỗ trợ để giải quyết vấn đề
                </p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 mt-1">
                <path fill="currentColor" d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 11H4v2h8.17l-3.59 3.59z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 Chọn tùy chọn phù hợp với nhu cầu của bạn
          </p>
        </div>
      </div>
    </>
  );
}
