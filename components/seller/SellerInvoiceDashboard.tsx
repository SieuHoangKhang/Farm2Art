"use client";

import React, { useEffect, useState } from "react";
import { SellerInvoice, InvoiceSummary } from "@/types/invoice";

export default function SellerInvoiceDashboard({ userId }: { userId?: string }) {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<SellerInvoice | null>(null);
  const [filter, setFilter] = useState<"all" | "generated" | "sent" | "viewed" | "paid">("all");

  // Lấy danh sách hóa đơn
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("sellerId", userId || "");
        if (filter !== "all") {
          queryParams.append("status", filter);
        }

        const response = await fetch(`/api/invoices/generate?${queryParams}`);
        if (!response.ok) throw new Error("Lỗi lấy hóa đơn");

        const data = await response.json();
        setInvoices(data.invoices || []);
      } catch (error) {
        console.error("Lỗi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchInvoices();
    }
  }, [userId, filter]);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: "Nháp", color: "bg-gray-200 text-gray-800" },
      generated: { label: "Tạo mới", color: "bg-blue-200 text-blue-800" },
      sent: { label: "Đã gửi", color: "bg-purple-200 text-purple-800" },
      viewed: { label: "Đã xem", color: "bg-green-200 text-green-800" },
      paid: { label: "Đã chi trả", color: "bg-emerald-200 text-emerald-800" },
    };
    const statusInfo = statusMap[status] || statusMap["draft"];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📋 Hóa Đơn Của Tôi</h1>
        <p className="text-gray-600">Xem và quản lý tất cả hóa đơn từ platform</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200 flex gap-2">
        {(["all", "generated", "sent", "viewed", "paid"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-3 transition ${
              filter === status
                ? "border-b-2 border-blue-500 text-blue-600 font-semibold"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {status === "all"
              ? "Tất cả"
              : status === "generated"
                ? "Tạo mới"
                : status === "sent"
                  ? "Đã gửi"
                  : status === "viewed"
                    ? "Đã xem"
                    : "Đã chi trả"}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600">Chưa có hóa đơn nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <button
              key={invoice.id}
              onClick={() => setSelectedInvoice(invoice)}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{invoice.invoiceNumber}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Kỳ: {new Date(invoice.periodStart).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(invoice.periodEnd).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Doanh thu</div>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(invoice.grossRevenue)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Các khoản trừ</div>
                      <div className="font-semibold text-red-600">
                        -{formatCurrency(invoice.totalDeductions)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Bạn nhận</div>
                      <div className="font-bold text-blue-600">
                        {formatCurrency(invoice.netPayout)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(invoice.status)}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}

/**
 * Invoice Detail Modal Component
 */
interface InvoiceDetailModalProps {
  invoice: SellerInvoice;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

function InvoiceDetailModal({ invoice, onClose, formatCurrency }: InvoiceDetailModalProps) {
  const handleExportPDF = async () => {
    try {
      // TODO: Implement PDF export
      alert("Chức năng tải PDF sẽ được cập nhật");
    } catch (error) {
      console.error("Lỗi tải PDF:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{invoice.invoiceNumber}</h2>
            <p className="text-blue-100">Hóa đơn chi tiết</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:text-blue-200 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Period & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Kỳ từ</label>
              <div className="font-semibold">
                {new Date(invoice.periodStart).toLocaleDateString("vi-VN")}
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Đến</label>
              <div className="font-semibold">
                {new Date(invoice.periodEnd).toLocaleDateString("vi-VN")}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Loại phí</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.lineItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.description}</div>
                      {item.quantity && (
                        <div className="text-xs text-gray-600 mt-1">
                          Số lượng: {item.quantity} x {formatCurrency(item.unitPrice || 0)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      -{formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-6 rounded-lg space-y-3 border-l-4 border-blue-500">
            <div className="flex justify-between">
              <span>Tổng doanh thu:</span>
              <span className="font-semibold text-green-600">{formatCurrency(invoice.grossRevenue)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>• Phí đi lấy:</span>
              <span>-{formatCurrency(invoice.pickupFeesTotal)}</span>
            </div>
            {invoice.processingFeesTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>• Phí sơ chế:</span>
                <span>-{formatCurrency(invoice.processingFeesTotal)}</span>
              </div>
            )}
            {invoice.storageFeesTotal > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>• Phí lưu kho:</span>
                <span>-{formatCurrency(invoice.storageFeesTotal)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>• Hoa hồng platform:</span>
              <span>-{formatCurrency(invoice.commissionTotal)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold">Tổng cộng:</span>
              <span className="font-bold text-red-600">
                -{formatCurrency(invoice.totalDeductions)}
              </span>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded mt-4 flex justify-between items-center">
              <span className="font-semibold">Bạn sẽ nhận:</span>
              <span className="text-2xl font-bold">{formatCurrency(invoice.netPayout)}</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-sm text-gray-500 space-y-1">
            <div>📅 Tạo: {new Date(invoice.createdAt).toLocaleString("vi-VN")}</div>
            {invoice.generatedAt && (
              <div>✅ Tạo hóa đơn: {new Date(invoice.generatedAt).toLocaleString("vi-VN")}</div>
            )}
            {invoice.sentAt && (
              <div>📧 Gửi: {new Date(invoice.sentAt).toLocaleString("vi-VN")}</div>
            )}
            {invoice.viewedAt && (
              <div>👁️ Xem: {new Date(invoice.viewedAt).toLocaleString("vi-VN")}</div>
            )}
            {invoice.paidAt && (
              <div>💰 Thanh toán: {new Date(invoice.paidAt).toLocaleString("vi-VN")}</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleExportPDF}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
            >
              📥 Tải PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
