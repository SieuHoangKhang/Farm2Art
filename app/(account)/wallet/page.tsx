'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'payment' | 'refund';
  amount: number;
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
}

interface Wallet {
  userId: string;
  balance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  transactions: Transaction[];
}

export default function WalletPage() {
  const { user } = useAuthUser();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdraw'>('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountNumber: '', accountHolder: '' });

  useEffect(() => {
    if (user?.uid) {
      loadWallet();
    }
  }, [user]);

  const loadWallet = async () => {
    try {
      // Mock wallet data
      const mockWallet: Wallet = {
        userId: user?.uid || '',
        balance: 2500000,
        totalDeposited: 10000000,
        totalWithdrawn: 7500000,
        transactions: [
          {
            id: 'txn_1',
            type: 'deposit',
            amount: 2000000,
            description: 'Nạp tiền qua VNPay',
            timestamp: Date.now() - 1000 * 60 * 60 * 24,
            status: 'completed',
          },
          {
            id: 'txn_2',
            type: 'payment',
            amount: 500000,
            description: 'Thanh toán đơn hàng #ORD123',
            timestamp: Date.now() - 1000 * 60 * 60 * 48,
            status: 'completed',
          },
          {
            id: 'txn_3',
            type: 'withdraw',
            amount: 1000000,
            description: 'Rút tiền về tài khoản ngân hàng',
            timestamp: Date.now() - 1000 * 60 * 60 * 72,
            status: 'completed',
          },
          {
            id: 'txn_4',
            type: 'refund',
            amount: 250000,
            description: 'Hoàn lại đơn hàng #ORD456',
            timestamp: Date.now() - 1000 * 60 * 60 * 96,
            status: 'completed',
          },
        ],
      };
      setWallet(mockWallet);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const amount = parseInt(withdrawAmount);
    if (!wallet || amount > wallet.balance || amount <= 0) {
      alert('Số tiền không hợp lệ');
      return;
    }

    try {
      // Mock withdrawal
      const newTransaction: Transaction = {
        id: `txn_${Date.now()}`,
        type: 'withdraw',
        amount,
        description: `Rút tiền về ${bankInfo.bankName} - ${bankInfo.accountNumber}`,
        timestamp: Date.now(),
        status: 'pending',
      };

      setWallet({
        ...wallet,
        balance: wallet.balance - amount,
        totalWithdrawn: wallet.totalWithdrawn + amount,
        transactions: [newTransaction, ...wallet.transactions],
      });

      setWithdrawAmount('');
      setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
      alert('Yêu cầu rút tiền đã được gửi. Sẽ được xử lý trong 1-3 ngày');
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600';
      case 'withdraw':
      case 'payment':
        return 'text-red-600';
      case 'refund':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return '📥';
      case 'withdraw':
        return '📤';
      case 'payment':
        return '💳';
      case 'refund':
        return '🔄';
      default:
        return '📝';
    }
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-gray-50">
        <PageHeader title="Ví của tôi" subtitle="Quản lý số dư và giao dịch" />

        <Container>
          <div className="py-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : wallet ? (
              <>
                {/* Balance Card */}
                <Card className="mb-8 bg-gradient-to-r from-blue-600 to-blue-800">
                  <CardBody>
                    <div className="text-white">
                      <p className="text-sm opacity-90 mb-2">Số dư ví</p>
                      <p className="text-5xl font-bold mb-6">
                        {wallet.balance.toLocaleString('vi-VN')} VNĐ
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs opacity-75">Đã nạp</p>
                          <p className="font-semibold">
                            {wallet.totalDeposited.toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-75">Đã rút</p>
                          <p className="font-semibold">
                            {wallet.totalWithdrawn.toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  {['overview', 'transactions', 'withdraw'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-4 py-3 font-medium border-b-2 transition ${
                        activeTab === tab
                          ? 'text-blue-600 border-blue-600'
                          : 'text-gray-600 border-transparent hover:text-gray-900'
                      }`}
                    >
                      {tab === 'overview' && '📊 Tổng quan'}
                      {tab === 'transactions' && '📋 Giao dịch'}
                      {tab === 'withdraw' && '💰 Rút tiền'}
                    </button>
                  ))}
                </div>

                {/* Content */}
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardBody>
                        <p className="text-sm text-gray-600">Số dư hiện tại</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">
                          {wallet.balance.toLocaleString('vi-VN')} VNĐ
                        </p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <p className="text-sm text-gray-600">Tổng nạp</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {wallet.totalDeposited.toLocaleString('vi-VN')} VNĐ
                        </p>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <p className="text-sm text-gray-600">Tổng rút</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                          {wallet.totalWithdrawn.toLocaleString('vi-VN')} VNĐ
                        </p>
                      </CardBody>
                    </Card>
                  </div>
                )}

                {activeTab === 'transactions' && (
                  <div className="space-y-3">
                    {wallet.transactions.map(txn => (
                      <Card key={txn.id}>
                        <CardBody>
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3 flex-1">
                              <span className="text-2xl">{getTransactionIcon(txn.type)}</span>
                              <div>
                                <p className="font-medium text-gray-900">{txn.description}</p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {new Date(txn.timestamp).toLocaleString('vi-VN')}
                                </p>
                                <span className={`inline-block text-xs mt-2 px-2 py-1 rounded ${
                                  txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {txn.status === 'completed' && '✓ Thành công'}
                                  {txn.status === 'pending' && '⏳ Đang xử lý'}
                                  {txn.status === 'failed' && '✕ Thất bại'}
                                </span>
                              </div>
                            </div>
                            <p className={`font-bold text-lg ${getTransactionColor(txn.type)}`}>
                              {txn.type === 'deposit' || txn.type === 'refund' ? '+' : '-'}
                              {txn.amount.toLocaleString('vi-VN')} VNĐ
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}

                {activeTab === 'withdraw' && (
                  <Card>
                    <CardBody>
                      <div className="max-w-md space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Số tiền rút (VNĐ)
                          </label>
                          <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Nhập số tiền"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Số dư khả dụng: {wallet.balance.toLocaleString('vi-VN')} VNĐ
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Ngân hàng
                          </label>
                          <input
                            type="text"
                            value={bankInfo.bankName}
                            onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                            placeholder="VCB, ACB, Momo..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Số tài khoản
                          </label>
                          <input
                            type="text"
                            value={bankInfo.accountNumber}
                            onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                            placeholder="Số tài khoản"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Tên chủ tài khoản
                          </label>
                          <input
                            type="text"
                            value={bankInfo.accountHolder}
                            onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                            placeholder="Tên chủ tài khoản"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <button
                          onClick={handleWithdraw}
                          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition"
                        >
                          Yêu cầu rút tiền
                        </button>

                        <p className="text-xs text-gray-600">
                          * Rút tiền sẽ được xử lý trong 1-3 ngày làm việc
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-12">Không thể tải dữ liệu ví</div>
            )}
          </div>
        </Container>
      </div>
    </RequireAuth>
  );
}
