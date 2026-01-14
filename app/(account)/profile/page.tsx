'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
  default: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'ewallet';
  name: string;
  lastDigits: string;
  default: boolean;
}

interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  avatar?: string;
  savedAddresses: SavedAddress[];
  savedPaymentMethods: SavedPaymentMethod[];
  preferences: {
    notifications: boolean;
    promotionalEmails: boolean;
    language: 'vi' | 'en';
    darkMode: boolean;
  };
  privacy: {
    visibility: 'public' | 'private' | 'friends';
    showOrderHistory: boolean;
  };
}

export default function EnhancedProfilePage() {
  const { user } = useAuthUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'payments' | 'preferences' | 'privacy'>(
    'info'
  );
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Mock data
      const mockProfile: UserProfile = {
        userId: user?.uid || '',
        displayName: user?.displayName || 'Guest User',
        email: user?.email || 'user@example.com',
        phone: '0123456789',
        avatar: user?.photoURL,
        savedAddresses: [
          {
            id: '1',
            type: 'home',
            name: 'Nhà',
            phone: '0123456789',
            address: '123 Nguyễn Huệ',
            district: 'Quận 1',
            city: 'TP. Hồ Chí Minh',
            postalCode: '700000',
            default: true,
          },
        ],
        savedPaymentMethods: [
          {
            id: '1',
            type: 'card',
            name: 'Visa',
            lastDigits: '1234',
            default: true,
          },
        ],
        preferences: {
          notifications: true,
          promotionalEmails: true,
          language: 'vi',
          darkMode: false,
        },
        privacy: {
          visibility: 'private',
          showOrderHistory: false,
        },
      };

      setProfile(mockProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12">Không thể tải hồ sơ</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.displayName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  👤
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{profile.displayName}</h1>
                <p className="text-gray-600">{profile.email}</p>
              </div>
            </div>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                ✏️ Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="flex border-b">
            {['info', 'addresses', 'payments', 'preferences', 'privacy'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab === 'info' && '👤 Thông tin'}
                {tab === 'addresses' && '📍 Địa chỉ'}
                {tab === 'payments' && '💳 Thanh toán'}
                {tab === 'preferences' && '⚙️ Tùy chọn'}
                {tab === 'privacy' && '🔒 Quyền riêng tư'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Tên hiển thị</label>
                  <input
                    type="text"
                    defaultValue={profile.displayName}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={profile.email}
                    disabled={true}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    defaultValue={profile.phone}
                    disabled={!editMode}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:bg-gray-50"
                  />
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-600">
                  ➕ Thêm địa chỉ mới
                </button>
                {profile.savedAddresses.map(addr => (
                  <div key={addr.id} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {addr.name} {addr.default && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Mặc định</span>}
                        </h4>
                        <p className="text-gray-600">{addr.address}</p>
                        <p className="text-sm text-gray-600">{addr.district}, {addr.city}</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-blue-600 hover:text-blue-700">✏️</button>
                        <button className="text-red-600 hover:text-red-700">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:border-blue-600">
                  ➕ Thêm phương thức thanh toán
                </button>
                {profile.savedPaymentMethods.map(method => (
                  <div key={method.id} className="border border-gray-300 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {method.name} •••• {method.lastDigits}
                        {method.default && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Mặc định</span>}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-red-600 hover:text-red-700">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <label className="font-medium text-gray-900">Thông báo</label>
                  <input
                    type="checkbox"
                    defaultChecked={profile.preferences.notifications}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <label className="font-medium text-gray-900">Email khuyến mãi</label>
                  <input
                    type="checkbox"
                    defaultChecked={profile.preferences.promotionalEmails}
                    className="w-4 h-4"
                  />
                </div>
                <div className="flex items-center justify-between py-3">
                  <label className="font-medium text-gray-900">Ngôn ngữ</label>
                  <select defaultValue={profile.preferences.language} className="border border-gray-300 rounded px-3 py-1">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Hiển thị hồ sơ</label>
                  <select defaultValue={profile.privacy.visibility} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option value="public">Công khai</option>
                    <option value="friends">Chỉ bạn bè</option>
                    <option value="private">Riêng tư</option>
                  </select>
                </div>
                <div className="flex items-center justify-between py-3 border-t">
                  <label className="font-medium text-gray-900">Hiển thị lịch sử đơn hàng</label>
                  <input
                    type="checkbox"
                    defaultChecked={profile.privacy.showOrderHistory}
                    className="w-4 h-4"
                  />
                </div>
              </div>
            )}

            {editMode && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Lưu thay đổi
                </button>
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
