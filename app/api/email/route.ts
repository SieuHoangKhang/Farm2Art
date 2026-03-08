import { NextRequest, NextResponse } from 'next/server';

interface EmailTemplate {
  name: string;
  subject: string;
  htmlBody: string;
}

// Mock email templates
const emailTemplates: Record<string, EmailTemplate> = {
  orderConfirmation: {
    name: 'Order Confirmation',
    subject: 'Đơn hàng của bạn đã được xác nhận',
    htmlBody: `
      <h1>Xác nhận đơn hàng</h1>
      <p>Cảm ơn bạn đã đặt hàng từ Farm2Art!</p>
      <p>Đơn hàng {{orderId}} của bạn đang được chuẩn bị. Chúng tôi sẽ gửi cho bạn cập nhật sớm.</p>
    `,
  },
  orderShipped: {
    name: 'Order Shipped',
    subject: 'Đơn hàng của bạn đã gửi đi',
    htmlBody: `
      <h1>Đơn hàng đã gửi đi</h1>
      <p>Đơn hàng {{orderId}} của bạn đã được gửi đi cùng {{carrier}}.</p>
      <p>Mã vận đơn: {{trackingNumber}}</p>
    `,
  },
  orderDelivered: {
    name: 'Order Delivered',
    subject: 'Đơn hàng của bạn đã giao',
    htmlBody: `
      <h1>Đơn hàng đã giao</h1>
      <p>Đơn hàng {{orderId}} của bạn đã được giao thành công!</p>
      <p>Vui lòng <a href="{{reviewLink}}">đánh giá sản phẩm</a></p>
    `,
  },
  promotionalEmail: {
    name: 'Promotional',
    subject: ' {{promoTitle}}',
    htmlBody: `
      <h1>{{promoTitle}}</h1>
      <p>{{promoDescription}}</p>
      <p><a href="{{promoLink}}">Khám phá ngay</a></p>
    `,
  },
};

export async function POST(request: NextRequest) {
  try {
    const { to, templateName, variables } = await request.json();

    if (!to || !templateName) {
      return NextResponse.json(
        { error: 'Email and template name are required' },
        { status: 400 }
      );
    }

    const template = emailTemplates[templateName];
    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Replace variables in template
    let subject = template.subject;
    let htmlBody = template.htmlBody;

    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        subject = subject.replace(`{{${key}}}`, String(value));
        htmlBody = htmlBody.replace(`{{${key}}}`, String(value));
      });
    }

    // Mock email sending (in production, use SendGrid, Resend, or similar)
    console.log(`Email sent to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${htmlBody}`);

    return NextResponse.json(
      {
        success: true,
        messageId: `email_${Date.now()}`,
        to,
        subject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Get available templates
export async function GET() {
  return NextResponse.json({
    templates: Object.keys(emailTemplates),
    templateDetails: Object.entries(emailTemplates).map(([key, template]) => ({
      id: key,
      name: template.name,
      subject: template.subject,
    })),
  });
}
