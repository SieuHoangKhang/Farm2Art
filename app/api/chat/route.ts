import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      );
    }

    const normalizedMessage = message.toLowerCase().trim();

    // Enhanced knowledge base with 13 categories and comprehensive keyword matching
    const knowledgeBase: Record<string, { keywords: string[]; responses: string[] }> = {
      greet: {
        keywords: ['xin chào', 'chào', 'chào bạn', 'hello', 'hi', 'xin chào bạn', 'hey', 'lời chào'],
        responses: [
          '👋 Xin chào! Chào mừng bạn đến với Farm2Art. Tôi là trợ lý AI của bạn. Có gì tôi có thể giúp bạn?',
          '🌟 Xin chào bạn! Tôi rất vui được hỗ trợ bạn. Bạn cần tìm kiếm sản phẩm hay có câu hỏi gì không?',
          ' Chào bạn! Farm2Art rất sẵn lòng phục vụ. Để tôi giúp bạn tìm những sản phẩm tuyệt vời.'
        ]
      },
      search: {
        keywords: ['tìm', 'tìm kiếm', 'search', 'khám phá', 'lọc', 'tìm sản phẩm', 'sản phẩm nào', 'có sản phẩm', 'mua'],
        responses: [
          '🔍 Bạn có thể tìm kiếm theo:\n• Loại sản phẩm (nông sản, nước ép, công nghệ)\n• Giá cả\n• Địa chỉ bán hàng\n• Người bán\n\nHãy cho tôi biết bạn tìm gì?',
          '🛍️ Farm2Art có nhiều danh mục sản phẩm tuyệt vời. Bạn muốn tìm:\n- Sản phẩm nông sản tươi?\n- Đồ uống lành mạnh?\n- Tài chế tạo từ phế phẩm?\n- Bát đĩa artwork?\n\nHãy yêu cầu cụ thể hơn nhé!'
        ]
      },
      byproduct: {
        keywords: ['phế phẩm', 'tái chế', 'từ phế phẩm', 'tái sử dụng', 'xanh'],
        responses: [
          ' Farm2Art tự hào có sản phẩm tái chế từ phế phẩm nông sản! Những sản phẩm này:\n Thân thiện với môi trường\n Độc đáo và sáng tạo\n Giúp bảo vệ tự nhiên\n\nBạn muốn tìm hiểu thêm?'
        ]
      },
      art: {
        keywords: ['artwork', 'đĩa artwork', 'công nghệ', 'tuyệt tác', 'sáng tạo'],
        responses: [
          '🎨 Artwork của Farm2Art là những tác phẩm độc đáo được tạo từ nguyên liệu tối cao. Mỗi sản phẩm là:\n• Sáng tạo riêng\n• Thể hiện tình yêu thiên nhiên\n• Phù hợp làm quà tặng hoặc trang trí\n\nBạn có muốn xem các sản phẩm art không?'
        ]
      },
      price: {
        keywords: ['bao nhiêu tiền', 'giá', 'giá cả', 'rẻ', 'đắt', 'cost', 'price', 'mức giá', 'gía'],
        responses: [
          '💰 Giá cả Farm2Art:\n🥬 Sản phẩm nông sản: 50,000 - 500,000 VND\n🧃 Nước ép/Đồ uống: 80,000 - 300,000 VND\n🎨 Artwork: 150,000 - 2,000,000 VND\n\nBạn tìm sản phẩm trong khoảng giá nào?'
        ]
      },
      buy: {
        keywords: ['mua', 'đặt hàng', 'order', 'cách mua', 'bước mua', 'thanh toán', 'mua sao'],
        responses: [
          '🛒 Cách mua hàng trên Farm2Art:\n1️⃣ Tìm kiếm sản phẩm bạn yêu thích\n2️⃣ Xem thông tin chi tiết & bình luận\n3️⃣ Chọn số lượng\n4️⃣ Thêm vào giỏ hàng\n5️⃣ Thanh toán\n6️⃣ Nhận hàng\n\nBạn cần giúp gì thêm?'
        ]
      },
      payment: {
        keywords: ['thanh toán', 'trả tiền', 'payment', 'vnpay', 'thẻ', 'ví', 'chuyển khoản', 'hình thức thanh toán'],
        responses: [
          ' Farm2Art hỗ trợ nhiều hình thức thanh toán:\n✓ VNPay (thẻ ATM, thẻ tín dụng)\n✓ Chuyển khoản ngân hàng\n✓ Ví điện tử\n✓ Thanh toán khi nhận hàng (COD)\n\nBạn muốn chọn hình thức nào?'
        ]
      },
      shipping: {
        keywords: ['giao hàng', 'vận chuyển', 'phí ship', 'bao lâu', 'mất bao lâu', 'địa điểm', 'khu vực'],
        responses: [
          ' Vận chuyển Farm2Art:\n Thời gian: 2-5 ngày tùy địa điểm\n Phí ship: Miễn phí từ 500,000 VND\n Phạm vi: Toàn quốc\n\nBạn ở đâu để tính phí ship chính xác?'
        ]
      },
      account: {
        keywords: ['tài khoản', 'account', 'hồ sơ', 'cá nhân', 'quản lý', 'đăng nhập', 'đăng ký'],
        responses: [
          ' Quản lý tài khoản Farm2Art:\n Cập nhật thông tin cá nhân\n Xem lịch sử đơn hàng\n Chat với người bán\n Xem các sản phẩm yêu thích\n Cài đặt bảo mật\n\nBạn cần giúp gì với tài khoản?'
        ]
      },
      seller: {
        keywords: ['người bán', 'cửa hàng', 'shop', 'seller', 'nhà cung cấp', 'người bán hàng'],
        responses: [
          ' Thông tin người bán:\n Xem hồ sơ người bán\n Đánh giá người bán\n Chat trực tiếp\n Xem địa điểm bán\n Xem đánh giá sản phẩm\n\nBạn muốn tìm người bán cụ thể không?'
        ]
      },
      register: {
        keywords: ['đăng ký', 'tạo tài khoản', 'sign up', 'register', 'mở tài khoản'],
        responses: [
          '✍️ Cách đăng ký Farm2Art:\n1️⃣ Nhấp "Đăng ký" ở trang chủ\n2️⃣ Nhập email/số điện thoại\n3️⃣ Đặt mật khẩu mạnh\n4️⃣ Xác minh tài khoản\n5️⃣ Hoàn tất hồ sơ\n\nHoặc bạn có thể đăng nhập bằng Google/Facebook để nhanh hơn!'
        ]
      },
      support: {
        keywords: ['hỗ trợ', 'help', 'support', 'liên hệ', 'báo cáo', 'sự cố', 'vấn đề', 'lỗi'],
        responses: [
          ' Liên hệ hỗ trợ Farm2Art:\n Chat: Sử dụng tính năng chat trên ứng dụng\n Email: support@farm2art.vn\n⏰ Thời gian: 8:00 - 20:00 (Thứ 2 - Chủ nhật)\n Các vấn đề thường gặp: Thanh toán, giao hàng, sản phẩm\n\nTôi có thể giúp gì?'
        ]
      },
      green: {
        keywords: ['xanh', 'thân thiện', 'eco', 'bảo vệ', 'môi trường', 'tự nhiên', 'sạch', 'an toàn'],
        responses: [
          ' Farm2Art cam kết bảo vệ môi trường:\n Tất cả sản phẩm từ nguyên liệu tự nhiên\n Không dùng hóa chất độc hại\n Bao bì thân thiện sinh học\n Hỗ trợ nông dân bền vững\n\nVới mỗi mua hàng, bạn giúp đất nước xanh hơn!'
        ]
      },
      problem: {
        keywords: ['vấn đề', 'lỗi', 'sai', 'không hoạt động', 'bị hỏng', 'bị lỗi', 'không được', 'thế nào'],
        responses: [
          ' Farm2Art hỗ trợ các vấn đề:\n Sản phẩm bị hỏng: Đổi/Hoàn tiền 100%\n Đơn hàng không đến: Tra cứu & giải quyết\n Khác lỗi ứng dụng: Báo cáo để cải thiện\n Yêu cầu hoàn hủy: Hỗ trợ trong 24h\n\nVấn đề cụ thể là gì?'
        ]
      }
    };

    // Create a keyword map for easier matching
    const keywordMap: Record<string, string> = {};
    Object.entries(knowledgeBase).forEach(([category, data]) => {
      data.keywords.forEach(keyword => {
        keywordMap[keyword] = category;
      });
    });

    // Find matching category
    let matchedCategory = 'fallback';
    let maxMatchLength = 0;

    // Try to find the longest matching keyword (for better accuracy)
    const sortedKeywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);
    for (const keyword of sortedKeywords) {
      if (normalizedMessage.includes(keyword) && keyword.length > maxMatchLength) {
        matchedCategory = keywordMap[keyword];
        maxMatchLength = keyword.length;
      }
    }

    // Get response
    let response: string;
    if (matchedCategory !== 'fallback' && knowledgeBase[matchedCategory]) {
      const responses = knowledgeBase[matchedCategory].responses;
      response = responses[Math.floor(Math.random() * responses.length)];
    } else {
      // Fallback responses
      const fallbackResponses = [
        ' Câu hỏi hay! Tôi chưa có thông tin cụ thể về điều này. Bạn có thể:\n Liên hệ hỗ trợ: support@farm2art.vn\n Chat với người bán\n Hỏi về chủ đề khác',
        '🤔 Tôi chưa hiểu rõ câu hỏi của bạn. Hãy thử:\n• Cách tìm kiếm sản phẩm\n• Hỏi về giá cả\n• Hỏi cách mua hàng\n• Liên hệ hỗ trợ khách hàng',
        '📌 Có điều gì khác tôi có thể giúp? Ví dụ:\n✓ Tìm kiếm sản phẩm\n✓ Thông tin thanh toán\n✓ Hỏi về vận chuyển\n✓ Cách quản lý tài khoản'
      ];
      response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ reply: response }, { status: 200 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
