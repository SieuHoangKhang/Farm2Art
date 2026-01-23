import { NextRequest, NextResponse } from 'next/server';

interface SMSMessage {
  id: string;
  phoneNumber: string;
  message: string;
  type: 'order-status' | 'delivery' | 'promotion' | 'verification';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
}

// Mock SMS storage
const smsMessages: SMSMessage[] = [];

// SMS templates
const smsTemplates: Record<string, (data: any) => string> = {
  'order-status': (data) =>
    `Farm2Art: Đơn hàng #${data.orderId} của bạn đã ${data.status}. Kiểm tra: ${process.env.NEXT_PUBLIC_URL}`,
  'delivery': (data) =>
    `Farm2Art: Giao hàng #${data.orderId} dự kiến ${data.date}. Lái xe: ${data.driver}`,
  'promotion': (data) =>
    `Farm2Art: ${data.title} - Mã: ${data.code}. Giảm ${data.discount}%`,
  'verification': (data) =>
    `Farm2Art: Mã xác minh của bạn: ${data.code}. Hạn 10 phút.`,
};

// SMS service mock (integrate with Twilio, AWS SNS, or local SMS gateway)
async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // In production, integrate with Twilio or SMS gateway
  // Example with Twilio:
  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // return await client.messages.create({
  //   body: message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: phoneNumber,
  // });

  // For now, simulate success
  console.log(`[SMS] To: ${phoneNumber}`);
  console.log(`[SMS] Message: ${message}`);

  const messageId = `sms-${Date.now()}`;
  const smsRecord: SMSMessage = {
    id: messageId,
    phoneNumber,
    message,
    type: 'promotion',
    status: 'sent',
    sentAt: new Date().toISOString(),
  };
  smsMessages.push(smsRecord);

  return { success: true, messageId };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, type, data } = body;

    // Validate phone number
    if (!phoneNumber || !/^(\+84|0)[0-9]{9,10}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Get template and generate message
    const template = smsTemplates[type];
    if (!template) {
      return NextResponse.json({ error: 'Invalid SMS type' }, { status: 400 });
    }

    const message = template(data);

    // Check message length (SMS limit: 160 chars for ASCII, 70 for Unicode)
    if (message.length > 160) {
      return NextResponse.json(
        { error: 'Message too long' },
        { status: 400 }
      );
    }

    // Send SMS
    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message,
      });
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  } catch (error) {
    console.error('SMS error:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phone');

    if (phoneNumber) {
      const messages = smsMessages.filter(msg => msg.phoneNumber === phoneNumber);
      return NextResponse.json({ messages });
    }

    return NextResponse.json({ messages: smsMessages });
  } catch (error) {
    console.error('SMS error:', error);
    return NextResponse.json({ error: 'Failed to fetch SMS' }, { status: 500 });
  }
}
