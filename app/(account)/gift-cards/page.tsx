'use client';

import React, { useState, useEffect } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { notify } from '@/lib/utils/notify';

interface GiftCard {
  id: string;
  code: string;
  value: number;
  balance: number;
  expiryDate: number;
  createdAt: number;
  usedAt?: number;
  purchasedBy?: string;
}

export default function GiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [activeTab, setActiveTab] = useState<'my-cards' | 'purchase' | 'redeem'>('my-cards');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [redeemCode, setRedeemCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGiftCards();
  }, []);

  const loadGiftCards = async () => {
    try {
      // Mock gift cards
      const mockCards: GiftCard[] = [
        {
          id: 'gc_1',
          code: 'GIFT-2024-ABCD-1234',
          value: 500000,
          balance: 350000,
          expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
          createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
          purchasedBy: 'Người A',
        },
        {
          id: 'gc_2',
          code: 'GIFT-2024-EFGH-5678',
          value: 1000000,
          balance: 1000000,
          expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
          createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        },
      ];
      setGiftCards(mockCards);
    } catch (error) {
      console.error('Failed to load gift cards:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedAmount || !recipientEmail) {
      notify.error('Vui lòng chọn giá trị và nhập email');
      return;
    }

    setLoading(true);

    try {
      // Mock purchase
      const newCard: GiftCard = {
        id: `gc_${Date.now()}`,
        code: `GIFT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        value: selectedAmount,
        balance: selectedAmount,
        expiryDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      };

      setGiftCards([...giftCards, newCard]);
      setSelectedAmount(null);
      setRecipientEmail('');
      notify.success(`Thẻ quà tặng đã được tạo! Mã: ${newCard.code}`);
      notify.info(`Sẽ gửi email tới ${recipientEmail}`);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemCode) {
      notify.error('Vui lòng nhập mã thẻ');
      return;
    }

    setLoading(true);

    try {
      // Mock redeem
      const matchedCard = giftCards.find(c => c.code === redeemCode.trim());
      if (matchedCard) {
        notify.success(`Đã kích hoạt thẻ quà tặng! Cộng ${matchedCard.balance.toLocaleString('vi-VN')} VNĐ vào tài khoản của bạn`);
      } else {
        notify.success('Đã kích hoạt thẻ quà tặng thành công!');
      }
      setRedeemCode('');
    } catch (error) {
      console.error('Redeem failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Thẻ quà tặng" subtitle="Mua và sử dụng thẻ quà tặng" />

      <Container>
        <div className="py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-sage-200">
            {['my-cards', 'purchase', 'redeem'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-3 font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'text-emerald-600 border-emerald-600'
                    : 'text-stone-500 border-transparent hover:text-stone-800'
                }`}
              >
                {tab === 'my-cards' && '🎁 Thẻ của tôi'}
                {tab === 'purchase' && ' Mua thẻ'}
                {tab === 'redeem' && ' Kích hoạt'}
              </button>
            ))}
          </div>

          {/* My Gift Cards */}
          {activeTab === 'my-cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {giftCards.map(card => (
                <Card key={card.id} className="bg-gradient-to-br from-purple-500 to-pink-500">
                  <CardBody>
                    <div className="text-white">
                      <p className="text-sm opacity-90">FARM2ART GIFT CARD</p>
                      <p className="text-3xl font-bold mt-4 mb-8">
                        {card.balance.toLocaleString('vi-VN')} VNĐ
                      </p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs opacity-75 mb-1">Mã thẻ</p>
                          <p className="font-mono text-sm font-bold">{card.code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs opacity-75 mb-1">Hạn sử dụng</p>
                          <p className="text-sm font-semibold">
                            {new Date(card.expiryDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* Purchase Gift Card */}
          {activeTab === 'purchase' && (
            <Card>
              <CardBody>
                <div className="max-w-md space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-3">
                      Chọn giá trị thẻ
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[100000, 250000, 500000, 1000000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => setSelectedAmount(amount)}
                          className={`p-4 rounded-lg font-semibold transition border-2 ${
                            selectedAmount === amount
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                              : 'border-sage-200 hover:border-sage-300'
                          }`}
                        >
                          {amount.toLocaleString('vi-VN')} VNĐ
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-800 mb-2">
                      Email nhận thẻ
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={!selectedAmount || !recipientEmail || loading}
                    className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 font-medium transition"
                  >
                    {loading ? 'Đang xử lý...' : 'Mua thẻ quà tặng'}
                  </button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Redeem Gift Card */}
          {activeTab === 'redeem' && (
            <Card>
              <CardBody>
                <div className="max-w-md space-y-4">
                  <label className="block text-sm font-medium text-stone-800 mb-2">
                    Nhập mã thẻ để kích hoạt
                  </label>
                  <input
                    type="text"
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    placeholder="GIFT-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!redeemCode || loading}
                    className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 font-medium transition"
                  >
                    {loading ? 'Đang kích hoạt...' : 'Kích hoạt thẻ'}
                  </button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </Container>
    </div>
  );
}
