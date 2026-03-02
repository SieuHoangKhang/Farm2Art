'use client';

import React from 'react';

interface AvatarModalProps {
  isOpen: boolean;
  avatarUrl: string;
  displayName: string;
  onClose: () => void;
  onUpload?: (file: File) => void;
  isUploading?: boolean;
}

export default function AvatarModal({
  isOpen,
  avatarUrl,
  displayName,
  onClose,
  onUpload,
  isUploading = false,
}: AvatarModalProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!');
        return;
      }

      onUpload(file);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 bg-white border-b">
            <h2 className="text-lg font-semibold text-stone-800">{displayName}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-sage-100 rounded-full transition"
              title="Đóng"
            >
              ✕
            </button>
          </div>

          {/* Image Container */}
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full max-w-md rounded-lg object-cover"
              />
            ) : (
              <div className="w-64 h-64 rounded-lg bg-stone-200 flex items-center justify-center text-6xl">
                👤
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 w-full max-w-md">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 transition font-medium"
              >
                {isUploading ? '⏳ Đang tải...' : '📤 Đổi ảnh'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition font-medium"
              >
                Đóng
              </button>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
          />
        </div>
      </div>
    </>
  );
}
