'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { Card, CardBody } from '@/components/ui/Card';
import { notify } from '@/lib/utils/notify';
import {
  doc, getDoc, setDoc, collection, addDoc,
  query, where, orderBy, onSnapshot, updateDoc, increment,
} from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';

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
}

export default function WalletPage() {
  const { user } = useAuthUser();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'withdraw'>('overview');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  const [processing, setProcessing] = useState(false);

  // Load or create wallet
  useEffect(() => {
    if (!user?.uid) return;

    const walletRef = doc(firebaseDb, 'wallets', user.uid);

    const unsubWallet = onSnapshot(walletRef, async (snap) => {
      if (snap.exists()) {
        setWallet({ userId: user.uid, ...snap.data() } as Wallet);
      } else {
        // Create wallet for new user
        const newWallet = { userId: user.uid, balance: 0, totalDeposited: 0, totalWithdrawn: 0 };
        await setDoc(walletRef, newWallet);
        setWallet(newWallet);
      }
      setLoading(false);
    });

    return () => unsubWallet();
  }, [user?.uid]);

  // Load transactions
  useEffect(() => {
    if (!user?.uid) return;

    const txnRef = collection(firebaseDb, 'wallet_transactions');
    const q = query(txnRef, where('userId', '==', user.uid), orderBy('timestamp', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction)));
    });

    return () => unsub();
  }, [user?.uid]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || !bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      notify.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const amount = parseInt(withdrawAmount);
    if (!wallet || amount > wallet.balance || amount <= 0) {
      notify.error('Số tiền không hợp lệ');
      return;
    }

    setProcessing(true);
    try {
      // Create transaction
      await addDoc(collection(firebaseDb, 'wallet_transactions'), {
        userId: user!.uid,
        type: 'withdraw',
        amount,
        description: `Rút tiền về ${bankInfo.bankName} - ${bankInfo.accountNumber} (${bankInfo.accountHolder})`,
        timestamp: Date.now(),
        status: 'pending',
      });

      // Update wallet balance
      const walletRef = doc(firebaseDb, 'wallets', user!.uid);
      await updateDoc(walletRef, {
        balance: increment(-amount),
        totalWithdrawn: increment(amount),
      });

      setWithdrawAmount('');
      setBankInfo({ bankName: '', accountNumber: '', accountHolder: '' });
      notify.success('Yêu cầu rút tiền đã được gửi. Sẽ được xử lý trong 1-3 ngày');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      notify.error('Rút tiền thất bại. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'text-green-600';
      case 'withdraw': case 'payment': return 'text-red-600';
      case 'refund': return 'text-emerald-600';
      default: return 'text-stone-500';
    }
  };

  const getTransactionLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit': return 'Nạp tiền';
      case 'withdraw': return 'Rút tiền';
      case 'payment': return 'Thanh toán';
      case 'refund': return 'Hoàn tiền';
      default: return 'Giao dịch';
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Ví của tôi" subtitle="Quản lý số dư và giao dịch" />
      <Container>
        <div className="py-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : wallet ? (
            <>
              {/* Balance Card */}
              <Card className="mb-8 bg-gradient-to-r from-emerald-600 to-emerald-800">
                <CardBody>
                  <div className="text-white">
                    <p className="text-sm opacity-90 mb-2">Số dư ví</p>
                    <p className="text-5xl font-bold mb-6">
                      {wallet.balance.toLocaleString('vi-VN')} VND
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs opacity-75">Tổng nạp</p>
                        <p className="font-semibold">{wallet.totalDeposited.toLocaleString('vi-VN')} VND</p>
                      </div>
                      <div>
                        <p className="text-xs opacity-75">Tổng rút</p>
                        <p className="font-semibold">{wallet.totalWithdrawn.toLocaleString('vi-VN')} VND</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-stone-200">
                {(['overview', 'transactions', 'withdraw'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium border-b-2 transition ${
                      activeTab === tab
                        ? 'text-emerald-600 border-emerald-600'
                        : 'text-stone-500 border-transparent hover:text-stone-800'
                    }`}
                  >
                    {tab === 'overview' && 'Tổng quan'}
                    {tab === 'transactions' && 'Giao dịch'}
                    {tab === 'withdraw' && 'Rút tiền'}
                  </button>
                ))}
              </div>

              {/* Content */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardBody>
                      <p className="text-sm text-stone-500">Số dư hiện tại</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">
                        {wallet.balance.toLocaleString('vi-VN')} VND
                      </p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-sm text-stone-500">Tổng nạp</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">
                        {wallet.totalDeposited.toLocaleString('vi-VN')} VND
                      </p>
                    </CardBody>
                  </Card>
                  <Card>
                    <CardBody>
                      <p className="text-sm text-stone-500">Tổng rút</p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">
                        {wallet.totalWithdrawn.toLocaleString('vi-VN')} VND
                      </p>
                    </CardBody>
                  </Card>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12 text-stone-500">
                      Chưa có giao dịch nào
                    </div>
                  ) : (
                    transactions.map(txn => (
                      <Card key={txn.id}>
                        <CardBody>
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3 flex-1">
                              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-stone-600">
                                  {getTransactionLabel(txn.type).charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-stone-800">{txn.description}</p>
                                <p className="text-xs text-stone-500 mt-1">
                                  {new Date(txn.timestamp).toLocaleString('vi-VN')}
                                </p>
                                <span className={`inline-block text-xs mt-2 px-2 py-1 rounded ${
                                  txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {txn.status === 'completed' && 'Thành công'}
                                  {txn.status === 'pending' && 'Đang xử lý'}
                                  {txn.status === 'failed' && 'Thất bại'}
                                </span>
                              </div>
                            </div>
                            <p className={`font-bold text-lg ${getTransactionColor(txn.type)}`}>
                              {txn.type === 'deposit' || txn.type === 'refund' ? '+' : '-'}
                              {txn.amount.toLocaleString('vi-VN')} VND
                            </p>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'withdraw' && (
                <Card>
                  <CardBody>
                    <div className="max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-800 mb-2">
                          Số tiền rút (VND)
                        </label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="Nhập số tiền"
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <p className="text-xs text-stone-500 mt-1">
                          Số dư khả dụng: {wallet.balance.toLocaleString('vi-VN')} VND
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-800 mb-2">Ngân hàng</label>
                        <input
                          type="text"
                          value={bankInfo.bankName}
                          onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                          placeholder="VCB, ACB, Momo..."
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-800 mb-2">Số tài khoản</label>
                        <input
                          type="text"
                          value={bankInfo.accountNumber}
                          onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                          placeholder="Số tài khoản"
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-800 mb-2">Tên chủ tài khoản</label>
                        <input
                          type="text"
                          value={bankInfo.accountHolder}
                          onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                          placeholder="Tên chủ tài khoản"
                          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        onClick={handleWithdraw}
                        disabled={processing}
                        className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 font-medium transition"
                      >
                        {processing ? 'Đang xử lý...' : 'Yêu cầu rút tiền'}
                      </button>
                      <p className="text-xs text-stone-500">
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
  );
}
