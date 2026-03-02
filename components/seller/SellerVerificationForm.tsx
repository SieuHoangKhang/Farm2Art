'use client';

import React, { useState } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

export default function SellerVerificationForm() {
  const { user } = useAuthUser();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessRegistration: '',
    ownerName: '',
    ownerID: '',
    bankAccount: '',
    bankName: 'Vietcombank',
    businessAddress: '',
    phone: '',
    email: '',
  });

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-500">Vui lòng đăng nhập để xác thực người bán</p>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/seller-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.uid,
          ...formData,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit verification');

      setSubmitted(true);
    } catch (error) {
      console.error('Verification error:', error);
      alert('Lỗi khi gửi yêu cầu xác thực');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-2xl font-semibold text-green-900 mb-2">Yêu cầu đã được gửi</h2>
        <p className="text-green-700 mb-4">
          Chúng tôi sẽ kiểm tra tài liệu của bạn trong vòng 3-5 ngày làm việc
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-8">
      <h1 className="text-2xl font-semibold mb-6">Xác thực người bán</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Info */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Thông tin kinh doanh</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Tên doanh nghiệp
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Giấy đăng ký kinh doanh (URL)
              </label>
              <input
                type="text"
                name="businessRegistration"
                value={formData.businessRegistration}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Địa chỉ kinh doanh
              </label>
              <input
                type="text"
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Thông tin chủ doanh nghiệp</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Họ tên
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Ảnh CCCD/Hộ chiếu (URL)
              </label>
              <input
                type="text"
                name="ownerID"
                value={formData.ownerID}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Bank Info */}
        <div>
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Thông tin tài khoản ngân hàng</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Ngân hàng
              </label>
              <select
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>Vietcombank</option>
                <option>Techcombank</option>
                <option>ACB</option>
                <option>BIDV</option>
                <option>Agribank</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">
                Số tài khoản
              </label>
              <input
                type="text"
                name="bankAccount"
                value={formData.bankAccount}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-stone-800">
            📋 Xác thực sẽ mất 3-5 ngày làm việc. Vui lòng cung cấp thông tin chính xác để tránh từ chối.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu xác thực'}
        </button>
      </form>
    </div>
  );
}
