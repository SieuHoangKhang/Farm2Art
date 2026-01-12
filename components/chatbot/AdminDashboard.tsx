'use client';

import React, { useState, useEffect } from 'react';

interface CustomerMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  isAdmin: boolean;
}

interface ConversationData {
  [userId: string]: CustomerMessage[];
}

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [conversations, setConversations] = useState<ConversationData>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch all conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/admin-chat?all=true');
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || {});
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setLoading(false);
      }
    };

    const interval = setInterval(fetchConversations, 3000); // Refresh every 3 seconds
    fetchConversations();

    return () => clearInterval(interval);
  }, []);

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedUserId) return;

    try {
      const response = await fetch('/api/admin-chat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          message: replyMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send reply');
      }

      setReplyMessage('');
      
      // Refresh conversations
      const conversationsRes = await fetch('/api/admin-chat?all=true');
      if (conversationsRes.ok) {
        const data = await conversationsRes.json();
        setConversations(data.conversations || {});
      }
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Admin Dashboard Modal */}
      <div className="fixed bottom-24 right-6 w-full max-w-2xl h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-purple-500 text-white p-4 rounded-t-lg">
          <h2 className="font-semibold text-lg">⚙️ Quản lý tin nhắn</h2>
          <button
            onClick={onClose}
            className="hover:bg-purple-600 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                  <p>Đang tải...</p>
                </div>
              </div>
            ) : Object.keys(conversations).length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center text-gray-500">
                  <p className="text-sm mb-2">📭 Chưa có tin nhắn</p>
                  <p className="text-xs">Customers sẽ xuất hiện ở đây</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {Object.entries(conversations).map(([userId, messages]) => {
                  const lastMessage = messages[messages.length - 1];
                  const customerName = lastMessage?.userName || 'Unknown';
                  const isSelected = selectedUserId === userId;

                  return (
                    <button
                      key={userId}
                      onClick={() => setSelectedUserId(userId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-purple-100 border-l-4 border-purple-500'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">{customerName}</p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {lastMessage?.message || 'No messages'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {messages.length} tin nhắn
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat View */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedUserId ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {conversations[selectedUserId]?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg ${
                          msg.isAdmin
                            ? 'bg-purple-100 text-gray-800 rounded-bl-none'
                            : 'bg-blue-500 text-white rounded-br-none'
                        }`}
                      >
                        {msg.isAdmin && (
                          <p className="text-xs font-semibold text-purple-600 mb-1">👨‍💼 Admin</p>
                        )}
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                        <p
                          className={`text-xs mt-2 ${
                            msg.isAdmin ? 'text-gray-500' : 'text-blue-100'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex gap-2">
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                      placeholder="Trả lời tin nhắn..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                      rows={2}
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim()}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 transition-colors font-medium text-sm"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>👈 Chọn customer để xem tin nhắn</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
