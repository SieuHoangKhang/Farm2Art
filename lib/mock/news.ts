export type NewsItem = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  excerpt: string;
  content: Array<{
    heading: string;
    body: string;
  }>;
};

export const NEWS: NewsItem[] = [
  {
    slug: "khoi-dong-farm2art",
    title: "Farm2Art khởi động nền tảng giao dịch xanh",
    date: "2026-01-09",
    excerpt:
      "Farm2Art hướng tới việc kết nối phế phẩm nông nghiệp với nhu cầu tái chế và nghệ thuật, tối ưu chi phí và giảm lãng phí.",
    content: [
      {
        heading: "Mục tiêu",
        body:
          "Farm2Art tập trung vào việc tạo một nơi giao dịch minh bạch cho phế phẩm nông nghiệp và sản phẩm tái chế. Nền tảng giúp người mua và người bán dễ tìm thấy nhau hơn, giảm chi phí trung gian và tăng hiệu quả sử dụng tài nguyên.",
      },
      {
        heading: "Lợi ích cho cộng đồng",
        body:
          "Khi phế phẩm được đưa vào chuỗi tái chế, lượng rác thải giảm, đồng thời tạo ra cơ hội kinh doanh mới cho nông hộ, xưởng tái chế và các dự án sáng tạo. Farm2Art khuyến khích các giao dịch rõ ràng về số lượng, chất lượng, vị trí và thời gian giao nhận.",
      },
      {
        heading: "Hướng phát triển",
        body:
          "Trong giai đoạn tiếp theo, Farm2Art sẽ hoàn thiện luồng đơn hàng và thanh toán, tăng cường kiểm duyệt nội dung và nâng cấp trải nghiệm chat để hỗ trợ giao dịch an toàn hơn.",
      },
    ],
  },
  {
    slug: "tieu-chuan-anh-dang-tin",
    title: "Gợi ý chụp ảnh sản phẩm khi đăng tin",
    date: "2026-01-08",
    excerpt:
      "Ảnh rõ, đủ góc, có ánh sáng tự nhiên giúp người mua ra quyết định nhanh hơn. Dưới đây là vài checklist đơn giản.",
    content: [
      {
        heading: "Chụp đủ góc",
        body:
          "Nên có tối thiểu 3 ảnh: toàn cảnh, cận cảnh bề mặt, và ảnh thể hiện kích thước/khối lượng (ví dụ đặt cạnh thước hoặc vật quen thuộc).",
      },
      {
        heading: "Ánh sáng tự nhiên",
        body:
          "Chụp ở nơi đủ sáng, tránh ngược sáng. Ảnh sáng tự nhiên giúp màu sắc và tình trạng vật liệu hiển thị đúng hơn.",
      },
      {
        heading: "Thông tin kèm theo",
        body:
          "Trong mô tả, ghi rõ tình trạng (khô/ẩm), độ sạch, tạp chất, và cách đóng gói. Điều này giảm thời gian trao đổi và tránh hiểu lầm.",
      },
    ],
  },
  {
    slug: "an-toan-giao-dich",
    title: "Khuyến nghị an toàn khi giao dịch",
    date: "2026-01-07",
    excerpt:
      "Trao đổi thông tin minh bạch, xác nhận số lượng và địa điểm giao nhận trước khi thanh toán để tránh hiểu lầm.",
    content: [
      {
        heading: "Xác nhận thông tin trước khi chốt",
        body:
          "Trước khi đặt hàng, hai bên nên thống nhất: số lượng, đơn giá, phí vận chuyển, thời gian giao nhận và điều kiện hoàn/đổi (nếu có).",
      },
      {
        heading: "Ưu tiên giao dịch minh bạch",
        body:
          "Giữ trao đổi trong kênh chat của nền tảng giúp dễ đối soát khi có tranh chấp. Tránh chia sẻ thông tin nhạy cảm không cần thiết.",
      },
      {
        heading: "Cảnh giác yêu cầu bất thường",
        body:
          "Nếu gặp yêu cầu chuyển tiền gấp, thông tin mập mờ hoặc giá quá bất thường, hãy dừng giao dịch và báo cáo để được hỗ trợ.",
      },
    ],
  },
];

export function getNewsBySlug(slug: string): NewsItem | undefined {
  return NEWS.find((n) => n.slug === slug);
}
