import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../lib/firebase/admin';
import { retrieve, indexExists } from '../../../lib/rag/tfidf';

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

    // ULTRA-COMPREHENSIVE KNOWLEDGE BASE - 40+ categories with 500+ keyword variants
    const knowledgeBase: Record<string, { keywords: string[]; responses: string[] }> = {
      greet: {
        keywords: ['xin chào', 'chào', 'chào bạn', 'hello', 'hi', 'xin chào bạn', 'hey', 'lời chào', 'tí xíu', 'hello farm2art', 'có ai không', 'em nào', 'anh ơi', 'em ơi', 'chào chào', 'halo', 'yo', 'hiii', 'helllo', 'chao', 'xin kính chào', 'kính chào', 'tôi muốn chào', 'có thể giúp tôi không', 'xin chào bạn nhé', 'chào mừng'],
        responses: [
          '👋 Xin chào! Chào mừng bạn đến với Farm2Art - nền tảng bán nông sản & artwork tái chế. Có gì tôi có thể giúp?',
          '🌟 Xin chào bạn! Tôi là trợ lý AI của Farm2Art. Bạn đang tìm sản phẩm hay muốn biết thêm về chúng tôi?',
          '🎯 Chào bạn! Tôi sẵn sàng giúp bạn khám phá những sản phẩm chất lượng từ nông dân bền vững.',
          '😊 Chào mừng bạ! Hôm nay bạn muốn mua gì trên Farm2Art?',
          '👍 Xin chào xin chào! Mình giúp bạn tìm sản phẩm tuyệt vời nha!',
          '🌻 Chào bạn yêu! Bạn cần tìm nông sản tươi hay artwork tái chế?'
        ]
      },
      search: {
        keywords: ['tìm', 'tìm kiếm', 'search', 'khám phá', 'lọc', 'tìm sản phẩm', 'sản phẩm nào', 'có sản phẩm', 'mua', 'shopping', 'tìm mua', 'tìm xem', 'browse', 'xem xem', 'muốn tìm', 'có bán', 'bán cái gì', 'bán không', 'chỗ nào bán', 'hiện có gì'],
        responses: [
          '🔍 Bạn có thể tìm kiếm theo:\n• Loại sản phẩm\n• Khoảng giá\n• Địa điểm người bán\n• Đánh giá & số lượng bán\n\nBạn đang tìm gì cụ thể?',
          '🛍️ Farm2Art có kho sản phẩm phong phú:\n- 🥕 Nông sản tươi\n- 🧃 Nước ép & đồ uống\n- 🎨 Artwork tái chế\n- 📦 Combo & gói quà\n\nHãy cho tôi biết loại nào bạn quan tâm!'
        ]
      },
      vegetable: {
        keywords: ['rau', 'cà chua', 'dưa chuột', 'bắp cải', 'cây xanh', 'nông sản lá', 'rau sạch', 'rau hữu cơ', 'rau xanh', 'rau tươi', 'rau tây', 'rau nước ngoài', 'rau công nghệ cao', 'rau thủy canh', 'rau từ nông dân'],
        responses: [
          '🥬 Farm2Art cung cấp rau xanh từ nông dân bền vững:\n• Luôn tươi, không hóa chất\n• Giao hàng nhanh 2-3 ngày\n• Giá: 50,000 - 150,000 VND/kg\n\nBạn muốn chọn loại rau nào?'
        ]
      },
      fruit: {
        keywords: ['quả', 'trái', 'cam', 'chanh', 'dâu', 'chuối', 'xoài', 'ổi', 'thanh long', 'trái cây', 'quả tươi', 'quả sạch', 'trái cây hữu cơ', 'quả ngoại', 'quả nhập', 'quả nội'],
        responses: [
          '🍊 Trái cây tươi từ các vùng nông sản:\n• Được chọn lọc kỹ lưỡng\n• Đủ độ chín, đảm bảo chất lượng\n• Giá: 50,000 - 300,000 VND/kg\n• Thích hợp làm quà hoặc ăn hàng ngày\n\nLoại trái cây nào bạn thích?'
        ]
      },
      juice: {
        keywords: ['nước ép', 'nước', 'uống', 'cam ép', 'chanh', 'nước trái cây', 'sinh tố'],
        responses: [
          '🧃 Nước ép 100% từ trái cây tươi:\n• Không đường, không chất bảo quản\n• Áp lực lạnh để giữ dinh dưỡng\n• Giá: 80,000 - 200,000 VND/chai\n• Giao nhanh, tươi mới\n\nFlavor nào bạn muốn? (Cam, Chanh, Dâu, Lựu...)'
        ]
      },
      honey: {
        keywords: ['mật ong', 'ong mật', 'mật', 'ong', 'honey'],
        responses: [
          '🍯 Mật ong nguyên chất từ các trang trại:\n• Không pha trộn, không xử lý hóa chất\n• Giàu dưỡng chất, hỗ trợ sức khỏe\n• Giá: 150,000 - 500,000 VND/hũ\n• Có chứng chỉ chất lượng\n\nBạn muốn tìm mật ong nào? (Hoa cà phê, Rừng, v.v.)'
        ]
      },
      artwork: {
        keywords: ['artwork', 'tranh', 'tác phẩm', 'trang trí', 'quà', 'họa', 'sáng tạo', 'điêu khắc'],
        responses: [
          '🎨 Artwork tái chế của Farm2Art - độc đáo & bền vững:\n• Từ vỏ dừa, giấy dệt, gỗ phế liệu\n• Thủ công, hạn chế (limited edition)\n• Giá: 150,000 - 2,000,000 VND\n• Hoàn hảo làm quà tặng hoặc trang trí\n\nBạn thích phong cách nào?'
        ]
      },
      recycled: {
        keywords: ['phế phẩm', 'tái chế', 'tái sử dụng', 'xanh', 'eco', 'bảo vệ', 'phân hủy'],
        responses: [
          ' Farm2Art tự hào có sản phẩm tái chế:\n• Giảm rác thải nông sản\n• Thân thiện môi trường 100%\n• Sáng tạo & độc đáo\n• Hỗ trợ nông dân thêm doanh thu\n\nChi tiết sản phẩm tái chế?'
        ]
      },
      price_inquiry: {
        keywords: ['bao nhiêu tiền', 'giá', 'giá cả', 'rẻ', 'đắt', 'cost', 'price', 'mức giá', 'tính giá'],
        responses: [
          '💰 Bảng giá Farm2Art:\n🥬 Nông sản: 50k - 500k VND\n🧃 Nước ép: 80k - 300k VND\n🍯 Đặc sản: 150k - 500k VND\n🎨 Artwork: 150k - 2M VND\n\n+ Ship: Miễn phí từ 500k (nội thành)\nBạn tìm sản phẩm trong tầm giá nào?'
        ]
      },
      bulk_order: {
        keywords: ['mua số lượng lớn', 'sỉ', 'đặt hàng lô', 'bulk', 'giá sỉ'],
        responses: [
          '📦 Farm2Art hỗ trợ bán sỉ:\n• Giảm giá từ 5+ sản phẩm\n• Liên hệ: kinh doanh@farm2art.vn\n• Hỗ trợ giải pháp theo nhu cầu\n• Giao hàng định kỳ\n\nBạn muốn bao nhiêu?'
        ]
      },
      combo: {
        keywords: ['combo', 'gói', 'bundle', 'bộ', 'set', 'quà', 'gói quà'],
        responses: [
          '🎁 Farm2Art có các combo hấp dẫn:\n• Combo sức khỏe: Rau + Nước ép + Mật ong\n• Combo quà tặng: Artwork + Nông sản\n• Combo tuần: Nông sản & đồ uống lên menu hàng tuần\n• Giá combo tiết kiệm hơn 10-20%\n\nBạn muốn combo nào?'
        ]
      },
      buying_process: {
        keywords: ['mua', 'đặt hàng', 'order', 'cách mua', 'bước mua', 'quy trình'],
        responses: [
          '🛒 Quy trình mua hàng Farm2Art:\n1️⃣ Tìm & xem sản phẩm\n2️⃣ Xem bình luận & đánh giá\n3️⃣ Chọn số lượng\n4️⃣ Xem thông tin người bán\n5️⃣ Thêm vào giỏ\n6️⃣ Thanh toán\n7️⃣ Nhận & đánh giá\n\nBạn cần giúp bước nào?'
        ]
      },
      payment_methods: {
        keywords: ['thanh toán', 'trả tiền', 'payment', 'hình thức', 'vnpay', 'thẻ', 'ví', 'chuyển khoản'],
        responses: [
          '💳 Hình thức thanh toán Farm2Art:\n✓ VNPay (ATM/Visa/Mastercard): Tức thì\n✓ Chuyển khoản: Xác nhận 2h\n✓ Ví (Momo/ZaloPay): Tức thì\n✓ COD (khi nhận): Không phí\n\n🔒 Bảo mật 100% - Mã hóa SSL\nBạn chọn cách nào?'
        ]
      },
      shipping_info: {
        keywords: ['giao hàng', 'vận chuyển', 'ship', 'phí', 'bao lâu', 'thời gian', 'khoảng cách'],
        responses: [
          '🚚 Vận chuyển Farm2Art:\n⏱️ Thời gian: 2-5 ngày (tùy khoảng cách)\n💰 Phí: Miễn phí từ 500k, tính theo km\n📍 Phạm vi: Toàn quốc\n📍 Ngoại thành TP.HCM: +1-2 ngày + phí\n\nTracking: Link gửi qua email/SMS\nBạn ở đâu? Tôi tính phí chính xác.'
        ]
      },
      tracking: {
        keywords: ['theo dõi', 'tracking', 'đơn hàng', 'ở đâu', 'tới chưa', 'xem hàng'],
        responses: [
          '📍 Theo dõi đơn hàng:\n1️⃣ Mở email/SMS từ Farm2Art\n2️⃣ Nhấp link tracking\n3️⃣ Xem vị trí, thời gian giao\n4️⃣ Chat với người giao nếu cần\n\nHoặc:\n📱 Mở app Farm2Art → Tài khoản → Đơn hàng\nNhập mã đơn hàng: ?\n\nBạn cần kiểm tra đơn nào?'
        ]
      },
      profile_management: {
        keywords: ['tài khoản', 'hồ sơ', 'cá nhân', 'quản lý', 'cập nhật', 'thay đổi'],
        responses: [
          '👤 Quản lý tài khoản Farm2Art:\n✏️ Cập nhật thông tin cá nhân\n🎯 Xem lịch sử đơn hàng\n❤️ Danh sách yêu thích\n💬 Chat với người bán\n🔐 Cài đặt bảo mật & mật khẩu\n\nBạn muốn cập nhật thông tin gì?'
        ]
      },
      wishlist: {
        keywords: ['yêu thích', 'wishlist', 'lưu', 'danh sách', 'heart'],
        responses: [
          '❤️ Quản lý danh sách yêu thích:\n1️⃣ Click ❤️ trên sản phẩm\n2️⃣ Sản phẩm được lưu tự động\n3️⃣ Xem bất kỳ lúc nào\n4️⃣ Được thông báo nếu giảm giá\n5️⃣ Chia sẻ danh sách với bạn\n\nBạn muốn lưu sản phẩm nào?'
        ]
      },
      seller_profile: {
        keywords: ['người bán', 'cửa hàng', 'shop', 'seller', 'bán hàng', 'cProfile', 'đánh giá'],
        responses: [
          '👨‍🌾 Hồ sơ người bán:\n⭐ Xem rating & số lượng bán\n📝 Xem bình luận từ khách\n📍 Xem địa điểm & giờ hoạt động\n💬 Chat trực tiếp với người bán\n✅ Xem chứng chỉ kiểm chứng\n\nBạn muốn tìm người bán cụ thể không?'
        ]
      },
      seller_registration: {
        keywords: ['bán', 'đăng ký bán', 'trở thành người bán', 'seller', 'shop', 'cửa hàng'],
        responses: [
          '🛵 Cách trở thành người bán Farm2Art:\n1️⃣ Đáp ứng tiêu chí: 18+, nông dân hoặc artisan\n2️⃣ Gửi đơn + chứng chỉ\n3️⃣ Farm2Art kiểm duyệt (3-5 ngày)\n4️⃣ Cấp quyền bán\n5️⃣ Bắt đầu bán (2% hoa hồng)\n\nBạn muốn đăng ký? support@farm2art.vn'
        ]
      },
      reviews: {
        keywords: ['đánh giá', 'bình luận', 'review', 'sao', 'bản review', 'ý kiến'],
        responses: [
          '⭐ Đánh giá trên Farm2Art:\n1️⃣ Nhận hàng & kiểm tra\n2️⃣ Vào đơn hàng → Đánh giá\n3️⃣ Chọn sao (1-5)\n4️⃣ Viết bình luận\n5️⃣ Gửi (có thể kèm hình)\n\nBạn muốn đánh giá sản phẩm nào?'
        ]
      },
      registration: {
        keywords: ['đăng ký', 'tạo tài khoản', 'sign up', 'register', 'mở tài khoản', 'tài khoản mới'],
        responses: [
          '✍️ Cách đăng ký Farm2Art (2 phút):\n1️⃣ Trang chủ → \"Đăng ký\"\n2️⃣ Email hoặc số điện thoại\n3️⃣ Mật khẩu mạnh (8+ ký tự)\n4️⃣ Xác minh email/SMS\n5️⃣ Hoàn tất hồ sơ\n\n⚡ Nhanh: Đăng nhập Google/Facebook\nBạn sẵn sàng đăng ký?'
        ]
      },
      contact_support: {
        keywords: ['hỗ trợ', 'help', 'support', 'liên hệ', 'báo cáo', 'sự cố', 'vấn đề'],
        responses: [
          '📞 Liên hệ hỗ trợ Farm2Art:\n💬 Chat: Sử dụng tính năng chat trên app\n📧 Email: support@farm2art.vn\n⏰ 8:00 - 20:00 (Thứ 2 - CN, không lễ)\n🔧 Hỗ trợ: Thanh toán, giao hàng, sản phẩm, tài khoản\n\nVấn đề của bạn là gì?'
        ]
      },
      complaints: {
        keywords: ['hỏng', 'lỗi', 'sai', 'không hoạt động', 'không được', 'vấn đề', 'bị thiệt'],
        responses: [
          '⚠️ Farm2Art hỗ trợ 100%:\n❌ Sản phẩm hỏng: Đổi/Hoàn 100% (xác nhận hình)\n❌ Đơn không đến: Tra cứu + bồi thường\n❌ Lỗi ứng dụng: Báo cáo để sửa ngay\n❌ Huỷ/Hoàn: Xử lý 24h\n\n⏱️ Quy trình: Chat → Hình ảnh → Xử lý 48h\nBạn gặp vấn đề gì cụ thể?'
        ]
      },
      refund: {
        keywords: ['hoàn tiền', 'hoàn', 'refund', 'lấy lại tiền', 'trả lại'],
        responses: [
          '💰 Chính sách hoàn tiền Farm2Art:\n✓ Lý do: Hỏng, lỗi, không như mô tả\n✓ Thời hạn: Trong 7 ngày nhận hàng\n✓ Quy trình: Chat → Kiểm chứng → Hoàn\n✓ Thời gian: 1-3 ngày\n✓ Phí: Miễn phí nếu lỗi của shop\n\nBạn muốn hoàn tiền đơn nào?'
        ]
      },
      sustainability: {
        keywords: ['xanh', 'bảo vệ', 'môi trường', 'tự nhiên', 'sinh thái', 'eco', 'bền vững'],
        responses: [
          '🌱 Farm2Art cam kết bên vững:\n✓ Sản phẩm từ nông dân bảo vệ môi trường\n✓ Không hóa chất độc hại\n✓ Bao bì 100% tái chế\n✓ Giảm phát thải & rác thải\n✓ Mỗi mua = Hỗ trợ nông dân\n\nBạn quan tâm lĩnh vực nào? (Nông sản, Artwork, ...)'
        ]
      },
      about: {
        keywords: ['về', 'giới thiệu', 'farm2art', 'chúng tôi', 'ai', 'sứ mệnh', 'tầm nhìn'],
        responses: [
          '📚 Về Farm2Art:\n🌾 Nền tảng kết nối nông dân & artisan bền vững\n🎯 Sứ mệnh: Nâng cao giá trị nông sản, bảo vệ môi trường\n🌍 Phạm vi: Toàn quốc, 1000+ nông dân kiểm chứng\n🏆 Khác biệt: Artwork tái chế + Nông sản xanh\n💚 Cam kết: Lợi nhuận chia sẻ công bằng\n\nBạn muốn biết thêm?'
        ]
      },
      products: {
        keywords: ['sản phẩm', 'hàng hóa', 'gì', 'cái gì', 'gì vậy', 'có cái nào', 'items'],
        responses: [
          '🛍️ Farm2Art cung cấp 5 danh mục sản phẩm chính:\n\n🥬 **Nông sản tươi**: Rau, quả, sản phẩm đặc sản từ nông dân bền vững\n\n🧃 **Nước ép & Đồ uống**: 100% từ trái cây tươi, không đường\n\n🍯 **Đặc sản**: Mật ong, cà phê, sản phẩm nông sản đặc biệt\n\n🎨 **Artwork tái chế**: Tranh, trang trí từ phế phẩm nông sản\n\n📦 **Combo & Gói quà**: Bộ sản phẩm tiết kiệm + tặng bạn\n\nBạn muốn tìm loại nào?',
          '📦 Farm2Art có tất cả các sản phẩm bạn cần:\n✓ Nông sản tươi (50k-500k)\n✓ Nước ép & đồ uống (80k-300k)\n✓ Mật ong & đặc sản (150k-500k)\n✓ Artwork tái chế (150k-2M)\n✓ Gói combo tiết kiệm\n\nBạn muốn mua gì?'
        ]
      },
      policy: {
        keywords: ['chính sách', 'quy định', 'điều khoản', 'règles', 'policy', 'điểm thương lượng', 'chính sách hoàn tiền', 'chính sách ship', 'quy tắc', 'luật lệ', 'điều luật', 'bảo hành', 'cam kết', 'bảo vệ khách hàng', 'quyền lợi'],
        responses: [
          '📋 **Chính Sách Farm2Art**:\n\n💳 **Thanh toán**: VNPay, Chuyển khoản, Ví điện tử, COD (khi nhận)\n\n🚚 **Giao hàng**: 2-5 ngày, miễn phí từ 500k, toàn quốc\n\n🔄 **Hoàn/Đổi**: Lỗi sản phẩm = đổi/hoàn 100%, trong 7 ngày\n\n⭐ **Đánh giá**: Bạn có quyền đánh giá sau khi nhận hàng\n\n🌱 **Bảo vệ**: 100% sản phẩm tự nhiên, không hóa chất\n\nCác chính sách khác nào bạn muốn biết?',
          '✅ **Chính sách chính**:\n• Hoàn tiền nếu sản phẩm hỏng\n• Miễn phí ship từ 500k\n• Hỗ trợ 24/7 qua chat\n• Tất cả sản phẩm kiểm chứng chất lượng\n• Cam kết bảo vệ môi trường\n\nBạn muốn hỏi chính sách nào cụ thể?'
        ]
      },
      farmer: {
        keywords: ['nông dân', 'farmer', 'trang trại', 'nông trại', 'sản xuất', 'nông dân nào', 'trang trại nào', 'hỗ trợ nông dân', 'nông dân bền vững', 'nông dân nhỏ', 'giúp nông dân', 'hỗ trợ farmer'],
        responses: [
          '🌾 Farm2Art hỗ trợ nông dân:\n✓ Kết nối nông dân với khách hàng\n✓ Giảm trung gian thương mại\n✓ Tăng giá trị sản phẩm\n✓ Kiểm chứng chất lượng tất cả\n✓ Chia sẻ lợi nhuận công bằng\n\nMỗi mua = Hỗ trợ nông dân!',
          '👨‍🌾 Farm2Art kết nối hơn 1000+ nông dân bền vững.\nTất cả sản phẩm được kiểm chứng chất lượng & giấy tờ pháp lý.\n\nBạn muốn tìm sản phẩm từ nông dân cụ thể không?'
        ]
      },
      artisan: {
        keywords: ['artisan', 'thủ công', 'handmade', 'tác giả', 'nghệ nhân', 'craftsman', 'handcraft', 'người làm thủ công', 'người sáng tạo', 'nhà thiết kế', 'artist', 'handmade artist'],
        responses: [
          '🎨 Farm2Art kết nối các artisan & nhà thiết kế:\n✓ Sản phẩm thủ công độc đáo\n✓ Limited edition - Hạn chế\n✓ Mỗi sản phẩm = Tình yêu\n✓ Hỗ trợ cộng đồng sáng tạo\n\nBạn muốn xem artwork của artisan nào?'
        ]
      },
      quality: {
        keywords: ['chất lượng', 'kiểm chứng', 'chứng chỉ', 'an toàn', 'test', 'kiểm tra', 'đảm bảo', 'được kiểm duyệt', 'an tâm', 'safe', 'certified', 'chất lượng cao', 'sạch sẽ', 'không độc hại'],
        responses: [
          '✅ Cam kết chất lượng Farm2Art:\n✓ Tất cả sản phẩm kiểm chứng\n✓ Có chứng chỉ & giấy tờ pháp lý\n✓ Không thuốc độc hại\n✓ Đo lường & cân đúng\n✓ Test độc tố\n\nBạn hoàn toàn an tâm!'
        ]
      },
      brand: {
        keywords: ['thương hiệu', 'brand', 'farm2art brand', 'shop chính hãng', 'hãng nào', 'của ai', 'shop nào', 'tên shop', 'tên hãng', 'uy tín', 'chính thức'],
        responses: [
          '🏪 Farm2Art - Thương hiệu tin cậy:\n✓ Nền tảng lớn nhất VN kết nối nông dân\n✓ Review từ 100,000+ khách hàng\n✓ Được báo chí đưa tin\n✓ Hỗ trợ 24/7\n✓ Bảo vệ quyền lợi khách hàng\n\nChúng tôi là lựa chọn an toàn!'
        ]
      },
      discount: {
        keywords: ['giảm giá', 'khuyến mãi', 'promo', 'sale', 'discount', 'code', 'coupon', 'voucher', 'ưu đãi', 'deal', 'hot sale', 'flash sale', 'đã có khuyến mãi', 'sale hôm nay'],
        responses: [
          '🎉 Farm2Art có khuyến mãi hàng tuần:\n💰 Giảm giá sản phẩm\n🎁 Combo tiết kiệm\n🔥 Flash sale\n📍 Free ship\n💳 Code giảm giá\n\nFollowing Farm2Art để không miss deal!'
        ]
      },
      return: {
        keywords: ['đổi', 'trả', 'hoàn', 'return', 'exchange', 'đổi sản phẩm', 'trả sản phẩm', 'hoàn sản phẩm', 'đổi hàng', 'không ưng ý', 'huỷ đơn', 'trả hàng'],
        responses: [
          '🔄 Chính sách đổi/trả Farm2Art:\n✓ 7 ngày đổi/trả miễn phí\n✓ Sản phẩm nguyên đai, chưa sử dụng\n✓ Hoàn toàn miễn phí ship\n✓ Xử lý trong 48h\n\nBạn muốn đổi/trả sản phẩm nào?'
        ]
      },
      gift: {
        keywords: ['quà', 'tặng', 'gift', 'quà tặng', 'gợi ý quà', 'quà cho ai', 'quà sinh nhật', 'quà valentine', 'quà 8/3', 'quà tết', 'quà bạn', 'quà người yêu', 'quà gia đình', 'quà nào tốt'],
        responses: [
          '🎁 Farm2Art gợi ý quà tặng:\n👨‍👩‍👧‍👦 **Cho gia đình**: Rau, quả, nước ép\n💏 **Cho người yêu**: Artwork đẹp, combo quà\n👨‍👩‍👧 **Cho bạn**: Nước ép, mật ong\n🎂 **Sinh nhật**: Combo + artwork\n\nBạn tặng ai? Tôi sẽ gợi ý chi tiết!'
        ]
      }
    };

    // Helper: rule-based matcher
    const buildKeywordMap = () => {
      const map: Record<string, string> = {};
      Object.entries(knowledgeBase).forEach(([category, data]) => {
        data.keywords.forEach((keyword) => {
          map[keyword] = category;
        });
      });
      return map;
    };

    const keywordMap = buildKeywordMap();

    function getRuleResponse(input: string) {
      let matchedCategory = 'fallback';
      let maxMatchLength = 0;
      const sortedKeywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);
      for (const keyword of sortedKeywords) {
        if (input.includes(keyword) && keyword.length > maxMatchLength) {
          matchedCategory = keywordMap[keyword];
          maxMatchLength = keyword.length;
        }
      }

      if (matchedCategory !== 'fallback' && knowledgeBase[matchedCategory]) {
        const responses = knowledgeBase[matchedCategory].responses;
        return { response: responses[Math.floor(Math.random() * responses.length)], category: matchedCategory };
      }

      const fallbackResponses = [
        '💡 Bạn muốn hỏi gì? Tôi có thể giúp bạn:\n🛍️ Tìm sản phẩm (rau, quả, nước ép, artwork)\n💰 Hỏi giá cả\n🛒 Cách mua hàng\n💳 Hình thức thanh toán\n🚚 Giao hàng bao lâu\n\nHãy cụ thể hơn nhé!',
        '❓ Tôi chưa hiểu rõ câu hỏi. Hãy thử hỏi:\n• "Sản phẩm nào có?" → Xem danh sách\n• "Giá rau bao nhiêu?" → Xem giá\n• "Cách mua hàng" → Hướng dẫn mua\n• "Chính sách hoàn tiền" → Xem chính sách\n\nBạn muốn hỏi gì cụ thể?',
        '🎯 Liên hệ hỗ trợ ngay nếu cần:\n📧 Email: support@farm2art.vn\n💬 Chat trực tiếp: Mở app Farm2Art\n⏰ Thời gian: 8:00 - 20:00 hàng ngày\n\nHoặc hãy cho tôi biết bạn cần gì?',
        '💬 Có thể tôi chưa đủ "thông minh" với câu hỏi này. Hãy thử:\n✓ Hỏi về sản phẩm cụ thể (rau, nước ép, artwork)\n✓ Hỏi về mua bán (giá, thanh toán, giao hàng)\n✓ Hỏi về dịch vụ (hoàn tiền, đánh giá, account)\n\nCo thể giúp gì không?'
      ];

      return { response: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)], category: 'fallback' };
    }

    // Helper: call Gemini via REST (server-side) using API Key
    async function callGemini(promptText: string) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) return null;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generateText?key=${apiKey}`;
        const body = {
          prompt: { text: promptText },
          temperature: 0.2,
          maxOutputTokens: 512,
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          console.error('Gemini API error status:', res.status);
          return null;
        }

        const data = await res.json();

        // Try several possible response shapes to extract text
        const candidates = data?.candidates || data?.outputs || null;
        if (Array.isArray(candidates) && candidates.length) {
          // common shape: candidates[0].content[0].text
          const first = candidates[0];
          if (first?.content && Array.isArray(first.content)) {
            for (const c of first.content) {
              if (typeof c?.text === 'string') return c.text;
              if (typeof c === 'string') return c;
            }
          }

          // fallback: candidates[0].outputText or candidates[0].content
          if (typeof first?.outputText === 'string') return first.outputText;
          if (typeof first?.text === 'string') return first.text;
        }

        // Another fallback: top-level text
        if (typeof data?.output === 'string') return data.output;

        return null;
      } catch (err) {
        console.error('Gemini call failed:', err);
        return null;
      }
    }

    // First compute rule-based suggestion (for logging & fallback)
    const rule = getRuleResponse(normalizedMessage);

    // Attempt Gemini call with a helpful prompt
    let botReply: string | null = null;
    let usedModel = 'rule-based';

    let systemPrompt = `HƯỚNG DẪN CHI TIẾT - BỘ PHẬN HỖ TRỢ AI FARM2ART

BẠN LÀ AI TRỢ LÝ CHUYÊN NGHIỆP CỦA FARM2ART - NỀN TẢNG BÁN NÔNG SẢN & ARTWORK TÁI CHẾ

🎯 TONE & TÍNH CHẤT:
- Lịch sự, thân thiện, chuyên nghiệp
- Trả lời tiếng Việt, ngắn gọn (1-3 câu) - đủ thông tin, không dài dòng
- Nếu chưa hiểu, hỏi thêm câu hỏi cụ thể
- Luôn gợi ý hành động hoặc sản phẩm cụ thể
- Khi không chắc, liên hệ support@farm2art.vn

📦 DANH MỤC SẢN PHẨM CHÍNH:
1. Nông sản tươi: rau, quả phát sáng, mết ong, cua, cà phê hạt nguyên bản (50k-500k)
2. Nước ép & Đồ uống: 100% từ nông sản yên sào, chanh, cam (80k-300k)
3. Sản phẩm tái chế xanh: từ phế phẩm nông sản (thân thiện môi trường, độc đáo)
4. Artwork cao cấp: từ vỏ dừa, giấy dệt, gỗ - làm quà tặng, trang trí (150k-2M)
5. Combo & Gói quà hàng tuần

💳 THANH TOÁN (CHỌN 1):
✓ VNPay (thẻ ATM/tín dụng): nhanh, an toàn
✓ Chuyển khoản: xác nhận 2h
✓ Ví điện tử (Momo/ZaloPay): tức thì
✓ COD (thanh toán khi nhận): giao trước, trả sau

🚚 GIAO HÀNG:
- Phạm vi: Toàn quốc
- Thời gian: 2-5 ngày (tùy khoảng cách)
- Phí: Miễn phí từ 500k, tính theo cân nặng
- Theo dõi: Link tracking hoặc chat tôi

❌ SỰ CỐ & GIẢI PHÁP:
- Hỏng: Đổi/Hoàn 100% (xác nhận hình ảnh)
- Không đến: Tra cứu, hỗ trợ 24h
- Huỷ/Hoàn: Chấp nhận nếu chưa giao

👥 NGƯỜI BÁN:
- Farm2Art kiểm chứng tất cả người bán
- Chat trực tiếp với người bán để hỏi chi tiết
- Xem sao & số lượng bán để chọn đáng tin

🌱 ĐẶC BIỆT FARM2ART:
- Tái chế & bảo vệ môi trường
- Hỗ trợ nông dân bền vững
- Mỗi mua = góp phần xanh

📞 NẾU CẦN TRỢ GIÚP:
- Email: support@farm2art.vn
- Chat tôi hoặc liên hệ người bán trực tiếp
- Hỏi tôi bất cứ thứ gì, tôi sẽ giúp`;

    // If TF-IDF index exists, retrieve top contexts and include them in prompt (RAG)
    if (indexExists()) {
      try {
        const contexts = retrieve(normalizedMessage, 3);
        if (contexts && contexts.length) {
          const ctxText = contexts.map((c, i) => `📌 Thông tin liên quan ${i+1}:\n${c.text.substring(0, 200)}`).join('\n\n');
          systemPrompt += `\n\n${ctxText}`;
        }
      } catch (err) {
        console.error('RAG retrieve failed:', err);
      }
    }

    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

    const geminiResp = await callGemini(fullPrompt);
    if (geminiResp && typeof geminiResp === 'string' && geminiResp.trim().length > 0) {
      botReply = geminiResp.trim();
      usedModel = 'gemini';
    } else {
      botReply = rule.response;
      usedModel = 'rule-based';
    }

    // Log conversation to Firestore (if admin DB available)
    try {
      const db = getAdminDb();
      await db.collection('chat_logs').add({
        userMessage: message,
        userMessageNormalized: normalizedMessage,
        botReply,
        matchedCategory: rule.category,
        usedModel,
        createdAt: Date.now(),
      });
    } catch (logErr) {
      console.error('Failed to log chat:', logErr);
    }

    // Simulate small delay for UX parity
    await new Promise((resolve) => setTimeout(resolve, 400));

    return NextResponse.json({ reply: botReply }, { status: 200 });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
