import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure email transporter (mock - in production use SendGrid, AWS SES, etc)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

interface EmailData {
  to: string;
  subject: string;
  type: 'order-confirmation' | 'shipping-update' | 'review-request' | 'verification' | 'promotion';
  data?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailData = await request.json();

    let htmlContent = '';

    switch (body.type) {
      case 'order-confirmation':
        htmlContent = `
          <h2>Xác nhận đơn hàng #${body.data?.orderId}</h2>
          <p>Cảm ơn bạn đã đặt hàng!</p>
          <p>Tổng tiền: <strong>${body.data?.amount} VNĐ</strong></p>
          <p><a href="${process.env.NEXT_PUBLIC_URL}/account/orders/${body.data?.orderId}">Xem chi tiết đơn hàng</a></p>
        `;
        break;

      case 'shipping-update':
        htmlContent = `
          <h2>Cập nhật vận chuyển</h2>
          <p>Đơn hàng #${body.data?.orderId} của bạn: <strong>${body.data?.status}</strong></p>
          <p>Dự kiến giao: ${new Date(body.data?.estimatedDelivery).toLocaleDateString('vi-VN')}</p>
          <p><a href="${process.env.NEXT_PUBLIC_URL}/account/orders/${body.data?.orderId}">Theo dõi</a></p>
        `;
        break;

      case 'review-request':
        htmlContent = `
          <h2>Bạn đã nhận hàng!</h2>
          <p>Sản phẩm: <strong>${body.data?.productTitle}</strong></p>
          <p><a href="${process.env.NEXT_PUBLIC_URL}/listing/${body.data?.productId}#reviews">Viết đánh giá</a></p>
        `;
        break;

      case 'verification':
        htmlContent = `
          <h2>Xác minh tài khoản</h2>
          <p>Mã xác minh: <strong>${body.data?.code}</strong></p>
          <p>Hạn: 10 phút</p>
        `;
        break;

      case 'promotion':
        htmlContent = `
          <h2>${body.data?.title}</h2>
          <p>${body.data?.description}</p>
          <p><strong>Mã: ${body.data?.couponCode}</strong></p>
          <p><a href="${process.env.NEXT_PUBLIC_URL}/search">Mua ngay</a></p>
        `;
        break;
    }

    // Mock send - in production, actually send via transporter
    console.log(`[EMAIL] To: ${body.to}, Subject: ${body.subject}`);

    // In production:
    // await transporter.sendMail({
    //   from: process.env.GMAIL_USER,
    //   to: body.to,
    //   subject: body.subject,
    //   html: htmlContent,
    // });

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully (mock)',
    });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
