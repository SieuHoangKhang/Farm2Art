'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import AvatarModal from '@/components/profile/AvatarModal';

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
  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'payments' | 'preferences' | 'privacy'>('info');
  const [editMode, setEditMode] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Address management
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<SavedAddress>({
    id: '',
    type: 'home',
    name: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
    default: false,
  });

  // Payment management
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState<SavedPaymentMethod>({
    id: '',
    type: 'card',
    name: '',
    lastDigits: '',
    default: false,
  });

  useEffect(() => {
    if (user?.uid) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Load from Firestore
      const response = await fetch(`/api/profile?userId=${user?.uid}`);
      const data = await response.json();

      if (data && data.userId) {
        setProfile(data);
        setDisplayName(data.displayName || user?.displayName || 'User');
        setPhone(data.phone || '');
      } else {
        // Create default profile if doesn't exist
        const newProfile: UserProfile = {
          userId: user?.uid || '',
          displayName: user?.displayName || 'Guest User',
          email: user?.email || 'user@example.com',
          phone: '',
          avatar: user?.photoURL || undefined,
          savedAddresses: [],
          savedPaymentMethods: [],
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

        setProfile(newProfile);
        setDisplayName(newProfile.displayName);
        setPhone(newProfile.phone);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user?.uid) {
      alert('Vui lòng đăng nhập trước');
      return;
    }
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload thất bại');
      }

      const data = await response.json();

      if (profile && data.secure_url) {
        const updatedProfile = { ...profile, avatar: data.secure_url };
        setProfile(updatedProfile);
        setShowAvatarModal(false);
        alert('✅ Đã cập nhật ảnh đại diện!');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(`❌ Lỗi: ${error instanceof Error ? error.message : 'Upload thất bại'}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Address handlers
  const handleAddAddress = () => {
    setAddressForm({
      id: Date.now().toString(),
      type: 'home',
      name: '',
      phone: '',
      address: '',
      district: '',
      city: '',
      postalCode: '',
      default: false,
    });
    setEditingAddressId(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (addr: SavedAddress) => {
    setAddressForm(addr);
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleSaveAddress = async () => {
    if (!profile) return;

    let updated;
    if (editingAddressId) {
      // Update existing
      updated = profile.savedAddresses.map(a => a.id === editingAddressId ? addressForm : a);
    } else {
      // Add new
      updated = [...profile.savedAddresses, addressForm];
    }
    
    const newProfile = { ...profile, savedAddresses: updated };
    setProfile(newProfile);
    setShowAddressForm(false);
    
    // Save to Firestore
    if (user?.uid) {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProfile),
      });
    }
    
    alert('✅ Đã lưu địa chỉ!');
  };

  const handleDeleteAddress = async (id: string) => {
    if (!profile) return;
    const updated = {
      ...profile,
      savedAddresses: profile.savedAddresses.filter(a => a.id !== id),
    };
    setProfile(updated);
    
    // Save to Firestore
    if (user?.uid) {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    }
    
    alert('✅ Đã xóa địa chỉ!');
  };

  // Payment handlers
  const handleAddPayment = () => {
    setPaymentForm({
      id: Date.now().toString(),
      type: 'card',
      name: '',
      lastDigits: '',
      default: false,
    });
    setShowPaymentForm(true);
  };

  const handleSavePayment = async () => {
    if (!profile) return;
    const updated = {
      ...profile,
      savedPaymentMethods: [...profile.savedPaymentMethods, paymentForm],
    };
    setProfile(updated);
    setShowPaymentForm(false);
    
    // Save to Firestore
    if (user?.uid) {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    }
    
    alert('✅ Đã thêm phương thức thanh toán!');
  };

  const handleDeletePayment = async (id: string) => {
    if (!profile) return;
    const updated = {
      ...profile,
      savedPaymentMethods: profile.savedPaymentMethods.filter(m => m.id !== id),
    };
    setProfile(updated);
    
    // Save to Firestore
    if (user?.uid) {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    }
    alert('✅ Đã xóa phương thức thanh toán!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-12">Không thể tải hồ sơ</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                onClick={() => setShowAvatarModal(true)}
                className="cursor-pointer group relative"
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.displayName}
                    className="w-16 h-16 rounded-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl group-hover:opacity-75 transition-opacity">
                    👤
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-2xl">
                  🔍
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-amber-900">{profile.displayName}</h1>
                <p className="text-stone-500">{profile.email}</p>
              </div>
            </div>
            {!editMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                ✏️ Chỉnh sửa
              </button>
                <Link
                  href="/account"
                  className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition font-medium"
                >
                  ← Quay lại
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-sage-200 shadow-sm">
          <div className="flex border-b border-sage-200 overflow-x-auto">
            {['info', 'addresses', 'payments', 'preferences', 'privacy'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`py-4 px-6 font-medium text-center border-b-2 transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-emerald-600 border-emerald-600'
                    : 'text-stone-500 border-transparent hover:text-stone-800'
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
                {editMode ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-stone-800 mb-2">Tên hiển thị</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-800 mb-2">Email</label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled={true}
                        className="w-full px-4 py-2 border border-sage-300 rounded-lg bg-sage-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-800 mb-2">Số điện thoại</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={async () => {
                          if (profile && user?.uid) {
                            const updated = {
                              ...profile,
                              displayName,
                              phone,
                            };
                            
                            // Save to Firestore
                            await fetch('/api/profile', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(updated),
                            });
                            
                            setProfile(updated);
                          }
                          setEditMode(false);
                          alert('✅ Đã lưu thay đổi!');
                        }}
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
                      >
                        Lưu thay đổi
                      </button>
                      <button
                        onClick={() => {
                          if (profile) {
                            setDisplayName(profile.displayName);
                            setPhone(profile.phone);
                          }
                          setEditMode(false);
                        }}
                        className="flex-1 px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-sage-50 rounded-lg">
                      <p className="text-xs font-medium text-stone-400">Tên hiển thị</p>
                      <p className="text-lg font-semibold text-stone-800">{displayName}</p>
                    </div>
                    <div className="p-3 bg-sage-50 rounded-lg">
                      <p className="text-xs font-medium text-stone-400">Email</p>
                      <p className="text-lg font-semibold text-stone-800">{profile?.email}</p>
                    </div>
                    <div className="p-3 bg-sage-50 rounded-lg">
                      <p className="text-xs font-medium text-stone-400">Số điện thoại</p>
                      <p className="text-lg font-semibold text-stone-800">{phone || '—'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                {!showAddressForm ? (
                  <>
                    <button
                      onClick={handleAddAddress}
                      className="w-full py-2 border-2 border-dashed border-sage-300 rounded-lg text-emerald-600 hover:border-emerald-600 transition"
                    >
                      ➕ Thêm địa chỉ mới
                    </button>
                    {profile.savedAddresses.map(addr => (
                      <div key={addr.id} className="border border-sage-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-stone-800">
                              {addr.name} {addr.default && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Mặc định</span>}
                            </h4>
                            <p className="text-stone-500 text-sm mt-1">{addr.address}</p>
                            <p className="text-sm text-stone-500">{addr.district}, {addr.city}</p>
                            <p className="text-xs text-stone-400 mt-1">SĐT: {addr.phone}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditAddress(addr)}
                              className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200 transition"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="border border-sage-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-stone-800">
                      {editingAddressId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
                    </h3>
                    <input
                      type="text"
                      placeholder="Tên địa chỉ (Nhà, Công ty, ...)"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Số điện thoại"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Địa chỉ"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Quận/Huyện"
                        value={addressForm.district}
                        onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                        className="px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Thành phố"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveAddress}
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 px-4 py-2 bg-stone-200 text-stone-800 rounded hover:bg-stone-300 transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                {!showPaymentForm ? (
                  <>
                    <button
                      onClick={handleAddPayment}
                      className="w-full py-2 border-2 border-dashed border-sage-300 rounded-lg text-emerald-600 hover:border-emerald-600 transition"
                    >
                      ➕ Thêm phương thức thanh toán
                    </button>
                    {profile.savedPaymentMethods.map(method => (
                      <div key={method.id} className="border border-sage-200 rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-stone-800">
                            {method.name} •••• {method.lastDigits}
                            {method.default && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Mặc định</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePayment(method.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="border border-sage-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-stone-800">Thêm phương thức thanh toán</h3>
                    <select
                      value={paymentForm.type}
                      onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="card">Thẻ tín dụng</option>
                      <option value="bank">Tài khoản ngân hàng</option>
                      <option value="ewallet">Ví điện tử</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Tên phương thức"
                      value={paymentForm.name}
                      onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="4 chữ số cuối"
                      value={paymentForm.lastDigits}
                      onChange={(e) => setPaymentForm({ ...paymentForm, lastDigits: e.target.value })}
                      className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePayment}
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className="flex-1 px-4 py-2 bg-stone-200 text-stone-800 rounded hover:bg-stone-300 transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg border border-sage-100">
                  <label className="font-medium text-stone-800">Thông báo</label>
                  <input
                    type="checkbox"
                    checked={profile.preferences.notifications}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, notifications: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg border border-sage-100">
                  <label className="font-medium text-stone-800">Email khuyến mãi</label>
                  <input
                    type="checkbox"
                    checked={profile.preferences.promotionalEmails}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, promotionalEmails: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                </div>
                <div className="p-3 bg-sage-50 rounded-lg border border-sage-100">
                  <label className="block font-medium text-stone-800 mb-2">Ngôn ngữ</label>
                  <select
                    value={profile.preferences.language}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        preferences: { ...profile.preferences, language: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-3 bg-sage-50 rounded-lg border border-sage-100">
                  <label className="block font-medium text-stone-800 mb-2">Hiển thị hồ sơ</label>
                  <select
                    value={profile.privacy.visibility}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        privacy: { ...profile.privacy, visibility: e.target.value as any },
                      })
                    }
                    className="w-full px-3 py-2 border border-sage-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="public">Công khai</option>
                    <option value="friends">Chỉ bạn bè</option>
                    <option value="private">Riêng tư</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg border border-sage-100">
                  <label className="font-medium text-stone-800">Hiển thị lịch sử đơn hàng</label>
                  <input
                    type="checkbox"
                    checked={profile.privacy.showOrderHistory}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        privacy: { ...profile.privacy, showOrderHistory: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Avatar Modal */}
        <AvatarModal
          isOpen={showAvatarModal}
          avatarUrl={profile.avatar || ''}
          displayName={profile.displayName}
          onClose={() => setShowAvatarModal(false)}
          onUpload={handleAvatarUpload}
          isUploading={uploadingAvatar}
        />
      </div>
    </div>
  );
}
