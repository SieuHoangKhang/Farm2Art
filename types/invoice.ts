/**
 * Invoice Types - Hóa đơn tự động cho seller
 * Consolidates fees: pickup + storage + commission
 */

export type InvoiceStatus = "draft" | "generated" | "sent" | "viewed" | "paid" | "cancelled";
export type InvoiceType = "monthly" | "order_based" | "adjustment";

/**
 * Invoice Item - Chi tiết từng loại phí
 */
export type InvoiceLineItem = {
  id: string;
  type: "pickup_fee" | "processing_fee" | "storage_fee" | "commission" | "adjustment";
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number; // VNĐ
  reference?: {
    orderId?: string;
    listingId?: string;
  };
};

/**
 * Seller Invoice - Hóa đơn cho seller
 */
export type SellerInvoice = {
  id: string;
  sellerId: string;
  sellerName?: string;
  invoiceNumber: string; // INV-{YYYYMM}-{SELLER_ID}-{SEQ}
  invoiceType: InvoiceType;
  
  // Period
  periodStart: number; // Ngày bắt đầu kỳ
  periodEnd: number;   // Ngày kết thúc kỳ
  
  // Line Items - Chi tiết từng loại phí
  lineItems: InvoiceLineItem[];
  
  // Breakdown
  pickupFeesTotal: number;      // Tổng phí đi lấy
  processingFeesTotal: number;  // Tổng phí sơ chế
  storageFeesTotal: number;     // Tổng phí lưu kho
  commissionTotal: number;      // Tổng hoa hồng (% trên doanh thu)
  adjustmentsTotal: number;     // Các điều chỉnh (hoàn tiền, thêm, v.v.)
  
  // Totals
  totalDeductions: number; // Tổng các khoản trừ (fees + commission)
  grossRevenue: number;    // Tổng doanh thu (sum of all orders in period)
  netPayout: number;       // Số tiền seller nhận = grossRevenue - totalDeductions
  
  // Status & Timestamp
  status: InvoiceStatus;
  createdAt: number;
  generatedAt?: number;    // Khi tự động generate
  sentAt?: number;         // Khi gửi cho seller
  viewedAt?: number;       // Khi seller xem
  paidAt?: number;         // Khi seller nhận tiền
  
  // Communication
  messageId?: string;      // Message ID trong hệ thống chat
  emailSentAt?: number;    // Khi gửi email
  pdfUrl?: string;         // Link đến PDF file
  notes?: string;          // Ghi chú từ admin
};

/**
 * Monthly Invoice Summary - Tóm tắt hóa đơn hàng tháng
 */
export type InvoiceSummary = {
  invoiceId: string;
  invoiceNumber: string;
  periodStart: number;
  periodEnd: number;
  grossRevenue: number;
  totalDeductions: number;
  netPayout: number;
  status: InvoiceStatus;
  generatedAt: number;
  sentAt?: number;
};

/**
 * Invoice Generation Request
 */
export type InvoiceGenerationRequest = {
  sellerId: string;
  invoiceType: InvoiceType;
  periodStart?: number;
  periodEnd?: number;
  orderIds?: string[]; // Nếu order_based
  notes?: string;
};

/**
 * Fee Breakdown for Order - Hiển thị các khoản phí khi tạo đơn
 */
export type OrderFeeBreakdown = {
  subTotal: number;           // Tổng giá sản phẩm
  pickupFee: number;          // Phí đi lấy
  processingFee?: number;     // Phí sơ chế (nếu có)
  storageFee?: number;        // Phí lưu kho (nếu có)
  commission: number;         // Hoa hồng platform (%)
  commissionAmount: number;   // Số tiền hoa hồng
  totalDeductions: number;    // Tổng các khoản trừ
  platformTotal: number;      // Tổng tiền platform nhận (commission)
  sellerPayout: number;       // Tiền seller sẽ nhận
  grandTotal: number;         // Tổng tiền customer thanh toán
};
