import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SellerInvoice } from "@/types/invoice";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

function fmtDate(ts?: number) {
  return ts ? new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-";
}

function fmtDateTime(ts?: number) {
  return ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";
}

function getInvoiceTypeLabel(type?: string) {
  switch (type) {
    case "monthly": return "Hóa đơn hàng tháng";
    case "order_based": return "Hóa đơn theo đơn hàng";
    case "adjustment": return "Hóa đơn điều chỉnh";
    default: return "Hóa đơn dịch vụ";
  }
}

function getFeeTypeLabel(type?: string) {
  switch (type) {
    case "pickup_fee": return "Phí đi lấy hàng";
    case "processing_fee": return "Phí vận chuyển hàng";
    case "storage_fee": return "Phí lưu kho";
    case "commission": return "Hoa hồng platform";
    case "adjustment": return "Điều chỉnh";
    default: return type || "Khác";
  }
}

function normalizeFeeDescription(description?: string) {
  if (!description) return "-";
  return description
    .replace(/sơ chế\/chế biến/gi, "vận chuyển hàng")
    .replace(/phi so che\/che bien/gi, "phi van chuyen hang")
    .replace(/phí sơ chế/gi, "phí vận chuyển hàng")
    .replace(/phi so che/gi, "phi van chuyen hang");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getAdminDb();
  try {
    const { id } = await params;
    const snap = await db.collection("invoices").doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 });
    }

    const inv = snap.data() as SellerInvoice;

    const rows = (inv.lineItems || [])
      .map(
        (item, idx) => `
          <tr>
            <td style="text-align:center">${idx + 1}</td>
            <td>${getFeeTypeLabel(item.type)}</td>
            <td>${normalizeFeeDescription(item.description)}</td>
            <td style="text-align:center">${item.quantity || 1}</td>
            <td style="text-align:right">${fmtCurrency(item.unitPrice || item.amount)}</td>
            <td style="text-align:right">${fmtCurrency(item.amount)}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hóa đơn ${inv.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; background: #fff; }
    .invoice-container { max-width: 800px; margin: 0 auto; }
    
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #10b981; }
    .company-info h1 { color: #10b981; font-size: 28px; margin-bottom: 5px; }
    .company-info p { color: #6b7280; font-size: 14px; }
    
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 24px; color: #1f2937; margin-bottom: 5px; }
    .invoice-title .invoice-number { font-size: 16px; color: #10b981; font-weight: 600; }
    .invoice-title .invoice-date { font-size: 14px; color: #6b7280; margin-top: 5px; }
    
    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-box { background: #f9fafb; padding: 15px 20px; border-radius: 8px; min-width: 200px; }
    .info-box h3 { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
    .info-box p { font-size: 14px; color: #1f2937; font-weight: 500; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e5e7eb; padding: 12px; font-size: 13px; }
    th { background: #10b981; color: white; text-align: left; font-weight: 600; }
    tr:nth-child(even) { background: #f9fafb; }
    
    .totals { margin-top: 30px; width: 350px; margin-left: auto; }
    .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.total { font-size: 18px; font-weight: 700; color: #10b981; padding-top: 15px; }
    .totals-row.deduction { color: #ef4444; }
    .totals-row.net { color: #10b981; font-weight: 700; font-size: 16px; }
    
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-generated { background: #fef3c7; color: #92400e; }
    .status-sent { background: #dbeafe; color: #1e40af; }
    .status-paid { background: #d1fae5; color: #065f46; }
    
    .notes { margin-top: 30px; padding: 15px; background: #f9fafb; border-radius: 8px; }
    .notes h4 { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .notes p { font-size: 13px; color: #1f2937; }
    
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
    
    @media print {
      body { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="company-info">
        <h1>Farm2Art</h1>
        <p>Nền tảng thương mại nông sản Artisans</p>
        <p>Email: contact@farm2art.com</p>
      </div>
      <div class="invoice-title">
        <h2>${getInvoiceTypeLabel(inv.invoiceType)}</h2>
        <div class="invoice-number">${inv.invoiceNumber}</div>
        <div class="invoice-date">Ngày: ${fmtDate(inv.generatedAt || inv.createdAt)}</div>
        <div style="margin-top:8px">
          <span class="status-badge ${
            inv.status === "paid" ? "status-paid" : 
            inv.status === "sent" ? "status-sent" : "status-generated"
          }">
            ${inv.status === "generated" ? "Chờ gửi" : 
              inv.status === "sent" ? "Đã gửi" : 
              inv.status === "paid" ? "Đã thanh toán" : inv.status}
          </span>
        </div>
      </div>
    </div>

    <!-- Info Section -->
    <div class="info-section">
      <div class="info-box">
        <h3>Người bán</h3>
        <p>${inv.sellerName || "Không xác định"}</p>
        <p style="font-size:12px;color:#6b7280">ID: ${inv.sellerId}</p>
      </div>
      <div class="info-box">
        <h3>Kỳ hóa đơn</h3>
        <p>Từ: ${fmtDate(inv.periodStart)}</p>
        <p>Đến: ${fmtDate(inv.periodEnd)}</p>
      </div>
    </div>

    <!-- Line Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width:50px">STT</th>
          <th style="width:150px">Loại phí</th>
          <th>Nội dung</th>
          <th style="width:60px">SL</th>
          <th style="width:120px">Đơn giá</th>
          <th style="width:120px">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-row">
        <span>Tổng doanh thu:</span>
        <span>${fmtCurrency(inv.grossRevenue)}</span>
      </div>
      <div class="totals-row deduction">
        <span>Tổng khoản trừ:</span>
        <span>- ${fmtCurrency(inv.totalDeductions)}</span>
      </div>
      ${inv.adjustmentsTotal !== 0 ? `
      <div class="totals-row" style="color: ${inv.adjustmentsTotal > 0 ? '#3b82f6' : '#ef4444'}">
        <span>Điều chỉnh:</span>
        <span>${inv.adjustmentsTotal > 0 ? "+" : ""}${fmtCurrency(inv.adjustmentsTotal)}</span>
      </div>
      ` : ""}
      <div class="totals-row total net">
        <span>Số tiền thực nhận:</span>
        <span>${fmtCurrency(inv.netPayout)}</span>
      </div>
    </div>

    <!-- Notes -->
    ${inv.notes ? `
    <div class="notes">
      <h4>Ghi chú:</h4>
      <p>${inv.notes}</p>
    </div>
    ` : ""}

    <!-- Footer -->
    <div class="footer">
      <p>Cảm ơn quý khách hàng đã sử dụng dịch vụ của Farm2Art!</p>
      <p>Hóa đơn được tạo tự động vào lúc ${fmtDateTime(inv.createdAt)}</p>
    </div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Không thể xuất hóa đơn" }, { status: 500 });
  }
}
