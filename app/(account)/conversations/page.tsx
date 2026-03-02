'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
  productId?: string;
  productTitle?: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export default function ConversationsPage() {
  const { user } = useAuthUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    try {
      // Mock data
      const mockConversations: Conversation[] = [
        {
          id: 'conv_1',
          participantId: 'seller_001',
          participantName: 'Farm Tây Ninh',
          lastMessage: 'Okê, tôi sẽ gửi hàng ngay hôm nay',
          lastMessageTime: Date.now() - 1000 * 60 * 5,
          unreadCount: 0,
          productId: 'by-001',
          productTitle: 'Rơm khô cuộn',
        },
        {
          id: 'conv_2',
          participantId: 'buyer_001',
          participantName: 'Nguyễn Văn A',
          lastMessage: 'Sản phẩm còn hàng không?',
          lastMessageTime: Date.now() - 1000 * 60 * 30,
          unreadCount: 2,
          productId: 'art-001',
          productTitle: 'Tranh tái chế',
        },
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Mock messages
      const mockMessages: Message[] = [
        {
          id: 'msg_1',
          senderId: 'seller_001',
          text: 'Xin chào, bạn cần tư vấn gì không?',
          timestamp: Date.now() - 1000 * 60 * 10,
          read: true,
        },
        {
          id: 'msg_2',
          senderId: user?.uid || '',
          text: 'Bạn còn sản phẩm này không?',
          timestamp: Date.now() - 1000 * 60 * 8,
          read: true,
        },
        {
          id: 'msg_3',
          senderId: 'seller_001',
          text: 'Okê, tôi sẽ gửi hàng ngay hôm nay',
          timestamp: Date.now() - 1000 * 60 * 5,
          read: true,
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);

    try {
      const message: Message = {
        id: `msg_${Date.now()}`,
        senderId: user.uid,
        text: newMessage,
        timestamp: Date.now(),
        read: false,
      };

      setMessages([...messages, message]);
      setNewMessage('');

      // Update conversation last message
      setConversations(
        conversations.map(c =>
          c.id === selectedConversation.id
            ? {
                ...c,
                lastMessage: newMessage,
                lastMessageTime: Date.now(),
              }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
      <div className="min-h-screen">
        <PageHeader
          title="Tin nhắn"
          subtitle="Trò chuyện với người mua/người bán"
        />

        <Container>
          <div className="py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <div className="bg-white rounded-xl shadow-sm border border-sage-200 overflow-y-auto">
                <div className="p-4 border-b border-sage-200">
                  <h2 className="font-semibold text-amber-900">Cuộc trò chuyện</h2>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : conversations.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          loadMessages(conv.id);
                        }}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          selectedConversation?.id === conv.id
                            ? 'bg-emerald-50 border-l-4 border-emerald-500'
                            : 'hover:bg-sage-50'
                        } ${conv.unreadCount > 0 ? 'bg-emerald-50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-medium text-stone-800 text-sm">
                            {conv.participantName}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        {conv.productTitle && (
                          <p className="text-xs text-stone-500 mb-1">
                            Về: {conv.productTitle}
                          </p>
                        )}
                        <p className="text-xs text-stone-500 truncate">
                          {conv.lastMessage}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          {new Date(conv.lastMessageTime).toLocaleTimeString('vi-VN')}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-stone-500">
                    Không có cuộc trò chuyện
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-sage-200 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-sage-200">
                      <p className="font-semibold text-stone-800">
                        {selectedConversation.participantName}
                      </p>
                      {selectedConversation.productTitle && (
                        <p className="text-sm text-stone-500 mt-1">
                          📦 {selectedConversation.productTitle}
                        </p>
                      )}
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.senderId === user?.uid
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg ${
                              msg.senderId === user?.uid
                                ? 'bg-emerald-500 text-white'
                                : 'bg-sage-100 text-stone-800'
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.senderId === user?.uid
                                  ? 'text-emerald-100'
                                  : 'text-stone-500'
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString(
                                'vi-VN'
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-sage-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === 'Enter' && handleSendMessage()
                          }
                          placeholder="Nhập tin nhắn..."
                          className="flex-1 px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          disabled={sending}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={sending || !newMessage.trim()}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 font-medium"
                        >
                          {sending ? '...' : 'Gửi'}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-500">
                    <p>Chọn cuộc trò chuyện để bắt đầu</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </div>
  );
}
