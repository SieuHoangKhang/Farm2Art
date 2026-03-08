"use client";

import React, { useState } from "react";
import { ProcessingPreference } from "@/types/listing";

interface ListingFormProcessingOptionsProps {
  value?: ProcessingPreference;
  onChange: (value: ProcessingPreference) => void;
  showFeeEstimate?: boolean;
  estimatedPrice?: number;
}

/**
 * Tùy chọn hình thức xử lý khi seller đăng tin
 * - Tôi tự sơ chế (bán như nguyên liệu thô)
 * - Tôi muốn bạn sơ chế (platform xử lý)
 * - Khách chọn (buyer chọn loại)
 */
export function ListingProcessingOptions({
  value = "warehouse",
  onChange,
  showFeeEstimate = false,
  estimatedPrice = 100000,
}: ListingFormProcessingOptionsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          🏭 Hình thức xử lý sản phẩm
        </label>
        <p className="text-xs text-gray-500 mb-4">
          Lựa chọn này sẽ ảnh hưởng đến các khoản phí và hóa đơn gửi cho bạn
        </p>
      </div>

      <div className="space-y-3">
        {/* Option 1: Self Process */}
        <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition" style={{
          borderColor: value === "self" ? "#3b82f6" : "#e5e7eb",
          backgroundColor: value === "self" ? "#f0f9ff" : "transparent",
        }}>
          <input
            type="radio"
            name="processing"
            value="self"
            checked={value === "self"}
            onChange={(e) => onChange(e.target.value as ProcessingPreference)}
            className="mt-1 h-4 w-4"
          />
          <div className="ml-4 flex-1">
            <div className="font-semibold text-gray-900">
              🚜 Tôi tự sơ chế (Nguyên liệu thô)
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Bạn bán sản phẩm nguyên liệu, platform chỉ đi lấy và giao
            </p>
            <div className="text-xs text-gray-500 mt-2 bg-orange-50 border border-orange-100 p-2 rounded">
              🚗 Phí: Đi lấy hàng + Hoa hồng
            </div>
          </div>
        </label>

        {/* Option 2: Warehouse Process */}
        <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition" style={{
          borderColor: value === "warehouse" ? "#3b82f6" : "#e5e7eb",
          backgroundColor: value === "warehouse" ? "#f0f9ff" : "transparent",
        }}>
          <input
            type="radio"
            name="processing"
            value="warehouse"
            checked={value === "warehouse"}
            onChange={(e) => onChange(e.target.value as ProcessingPreference)}
            className="mt-1 h-4 w-4"
          />
          <div className="ml-4 flex-1">
            <div className="font-semibold text-gray-900">
              🏢 Để tôi sơ chế tại kho
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Platform sơ chế, lưu trữ, và giao tận nơi cho khách
            </p>
            <div className="text-xs text-gray-500 mt-2 bg-purple-50 border border-purple-100 p-2 rounded">
              🏭 Phí: Đi lấy + Sơ chế + Lưu kho + Hoa hồng
            </div>
          </div>
        </label>

        {/* Option 3: Buyer Choice */}
        <label className="flex items-start p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition" style={{
          borderColor: value === "buyer_choice" ? "#3b82f6" : "#e5e7eb",
          backgroundColor: value === "buyer_choice" ? "#f0f9ff" : "transparent",
        }}>
          <input
            type="radio"
            name="processing"
            value="buyer_choice"
            checked={value === "buyer_choice"}
            onChange={(e) => onChange(e.target.value as ProcessingPreference)}
            className="mt-1 h-4 w-4"
          />
          <div className="ml-4 flex-1">
            <div className="font-semibold text-gray-900">
              🤝 Khách hàng tự chọn
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Mỗi đơn hàng, khách sẽ chọn cách xử lý (nguyên liệu hay sơ chế)
            </p>
            <div className="text-xs text-gray-500 mt-2 bg-green-50 border border-green-100 p-2 rounded">
              ✨ Phí: Linh hoạt theo lựa chọn của khách
            </div>
          </div>
        </label>
      </div>

      {/* Fee Estimate */}
      {showFeeEstimate && estimatedPrice > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="font-semibold text-blue-900 mb-3">
            💡 Ước tính hóa đơn với giá {estimatedPrice.toLocaleString("vi-VN")}đ:
          </div>
          <div className="space-y-2 text-sm">
            {value === "self" && (
              <>
                <div className="flex justify-between">
                  <span>Giá sản phẩm:</span>
                  <span className="font-semibold">{estimatedPrice.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Phí đi lấy:</span>
                  <span>50.000đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Hoa hồng (10%):</span>
                  <span>{Math.round(estimatedPrice * 0.1).toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="border-t border-blue-300 pt-2 flex justify-between font-bold text-blue-900">
                  <span>Bạn nhận:</span>
                  <span>
                    {(estimatedPrice - 50000 - Math.round(estimatedPrice * 0.1)).toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </>
            )}

            {value === "warehouse" && (
              <>
                <div className="flex justify-between">
                  <span>Giá sản phẩm:</span>
                  <span className="font-semibold">{estimatedPrice.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Phí đi lấy:</span>
                  <span>50.000đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Phí sơ chế (15k/kg):</span>
                  <span>~75.000đ (ước tính)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Phí lưu kho (7 ngày):</span>
                  <span>~35.000đ (ước tính)</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>- Hoa hồng (10%):</span>
                  <span>{Math.round(estimatedPrice * 0.1).toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="border-t border-purple-300 pt-2 flex justify-between font-bold text-purple-900">
                  <span>Bạn nhận:</span>
                  <span>
                    {(
                      estimatedPrice -
                      50000 -
                      75000 -
                      35000 -
                      Math.round(estimatedPrice * 0.1)
                    ).toLocaleString("vi-VN")}
                    đ
                  </span>
                </div>
              </>
            )}

            {value === "buyer_choice" && (
              <div className="text-gray-600 italic">
                Phí sẽ tính theo lựa chọn của từng khách hàng, được thể hiện rõ trong hóa đơn
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
        <div className="font-semibold mb-2">📋 Lưu ý:</div>
        <ul className="space-y-1 text-xs">
          <li>✓ Chi tiết các khoản phí sẽ được gửi hóa đơn cho bạn mỗi tháng</li>
          <li>✓ Hóa đơn được gửi qua tin nhắn trong ứng dụng</li>
          <li>✓ Bạn sẽ nhận tiền sau 3 ngày xác nhận giao hàng</li>
          <li>✓ Bạn có thể thay đổi hình thức xử lý ở mỗi sản phẩm khác nhau</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Compact component dành cho quick preview
 */
export function ProcessingPreferenceCompact({ value }: { value?: ProcessingPreference }) {
  const labels = {
    self: "🚜 Tôi tự sơ chế",
    warehouse: "🏢 Platform sơ chế",
    buyer_choice: "🤝 Khách tự chọn",
  };

  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
      <span className="text-sm font-medium text-blue-900">
        {labels[value || "warehouse"]}
      </span>
    </div>
  );
}
