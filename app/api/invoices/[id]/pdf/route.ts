import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SellerInvoice } from "@/types/invoice";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
}

function fmtDate(ts?: number) {
  return ts ? new Date(ts).toLocaleString("vi-VN") : "-";
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
            <td>${idx + 1}</td>
            <td>${item.description}</td>
            <td style="text-align:right">${item.quantity || 1}</td>
            <td style="text-align:right">${fmtCurrency(item.unitPrice || item.amount)}</td>
            <td style="text-align:right">${fmtCurrency(item.amount)}</td>
          </tr>`
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hoa don ${inv.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
    h1 { margin: 0 0 8px 0; }
    .meta { margin: 4px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; }
    .totals { margin-top: 16px; width: 360px; margin-left: auto; }
    .totals div { display: flex; justify-content: space-between; margin: 4px 0; }
    .strong { font-weight: 700; }
    @media print { .no-print { display: none; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px;">
    <button onclick="window.print()">In / Tải PDF</button>
  </div>

  <h1>Farm2Art - Hóa đơn dịch vụ</h1>
  <div class="meta">Mã hóa đơn: <strong>${inv.invoiceNumber}</strong></div>
  <div class="meta">Seller: ${inv.sellerName || inv.sellerId}</div>
  <div class="meta">Ngày phát hành: ${fmtDate(inv.generatedAt || inv.createdAt)}</div>
  <div class="meta">Trạng thái: ${inv.status}</div>

  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Nội dung</th>
        <th>SL</th>
        <th>Đơn giá</th>
        <th>Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Doanh thu gộp</span><span>${fmtCurrency(inv.grossRevenue)}</span></div>
    <div><span>Tổng khoản trừ</span><span>${fmtCurrency(inv.totalDeductions)}</span></div>
    <div class="strong"><span>Thực nhận</span><span>${fmtCurrency(inv.netPayout)}</span></div>
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
