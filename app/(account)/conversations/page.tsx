'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { ref, onValue, limitToLast, query as rtdbQuery } from 'firebase/database';
import { firebaseDb, firebaseRtdb } from '@/lib/firebase/client';
import Link from 'next/link';

interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  lastMessage?: string;
  lastMessageTime?: number;
  productTitle?: string;
  updatedAt?: number;
}

export default function ConversationsPage() {
  const { user } = useAuthUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const convRef = collection(firebaseDb, 'conversations');
    const q = query(
      convRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs: Conversation[] = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Conversation))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setConversations(convs);
      setLoading(false);
    }, (err) => {
      console.error('Load conversations error:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getPartnerName = (conv: Conversation) => {
    if (!user?.uid || !conv.participantNames) return 'Người dùng';
    const partnerId = conv.participants.find((p) => p !== user.uid);
    return partnerId ? (conv.participantNames[partnerId] || 'Người dùng') : 'Người dùng';
  };

  const getPartnerId = (conv: Conversation) => {
    if (!user?.uid) return '';
    return conv.participants.find((p) => p !== user.uid) || '';
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Tin nhắn" subtitle="Trò chuyện với người mua/người bán" />

      <Container>
        <div className="py-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-stone-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-stone-600 font-medium text-lg mb-2">Chưa có cuộc trò chuyện</p>
              <p className="text-sm text-stone-500">
                Vào trang sản phẩm và nhấn &quot;Chat với người bán&quot; để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {conversations.map((conv) => {
                const partnerId = getPartnerId(conv);
                const partnerName = getPartnerName(conv);
                return (
                  <Link
                    key={conv.id}
                    href={`/chat?sellerId=${partnerId}${conv.productTitle ? `&product=${encodeURIComponent(conv.productTitle)}` : ''}`}
                    className="block bg-white rounded-xl border border-stone-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg flex-shrink-0">
                        {partnerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-stone-800">{partnerName}</p>
                          {conv.lastMessageTime && (
                            <p className="text-xs text-stone-400 flex-shrink-0 ml-2">
                              {new Date(conv.lastMessageTime).toLocaleDateString('vi-VN')}
                            </p>
                          )}
                        </div>
                        {conv.productTitle && (
                          <p className="text-xs text-emerald-600 mb-1">
                            Sản phẩm: {conv.productTitle}
                          </p>
                        )}
                        {conv.lastMessage && (
                          <p className="text-sm text-stone-500 truncate">
                            {conv.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
