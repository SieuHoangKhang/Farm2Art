"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

// Carousel banner data
const banners = [
  { id: 1, image: "/anhquangcao-1.png" },
  { id: 2, image: "/anhquangcao-2.png" },
  { id: 3, image: "/anhquangcao-3.png" },
];

// Mock data
const featuredProducts = [
  { id: 1, name: "Rơm lúa mì chất lượng cao", price: "450,000đ", type: "Phế phẩm", seller: "Trang trại Bắc Ninh", stock: "100 bao" },
  { id: 2, name: "Trấu cà phê nguyên liệu", price: "320,000đ", type: "Phế phẩm", seller: "HTX Hà Nội", stock: "250 kg" },
  { id: 3, name: "Vỏ cà phê tươi", price: "280,000đ", type: "Phế phẩm", seller: "Nông trại Đắk Lắk", stock: "500 kg" },
  { id: 4, name: "Mùn cưa thơm lọc sạch", price: "150,000đ", type: "Phế phẩm", seller: "Xưởng Hà Nam", stock: "1000 kg" },
  { id: 5, name: "Túi xách thủ công từ rơm", price: "350,000đ", type: "Thủ công", seller: "Xưởng Na Xá", stock: "50 cái" },
  { id: 6, name: "Đệm tatami rơm tự nhiên", price: "800,000đ", type: "Thủ công", seller: "Thương lái Nội", stock: "20 cái" },
  { id: 7, name: "Giỏ dệt trấu handmade", price: "280,000đ", type: "Thủ công", seller: "Làng nghề Tây Hồ", stock: "45 cái" },
  { id: 8, name: "Tạp chí từ xơ cỏ tái chế", price: "150,000đ", type: "Thủ công", seller: "Studio Xanh", stock: "300 cuốn" },
];

const stats = [
  { label: "Sản phẩm", value: "500+" },
  { label: "Người bán", value: "120+" },
  { label: "Đơn đã giao", value: "2,000+" },
  { label: "Tỉnh thành", value: "30+" },
];

const promotions = [
  { id: 1, title: "Rơm lúa mì chất lượng cao", desc: "Giảm 15% cho đơn hàng từ 5 bao trở lên - Hàng mới đã về", tag: "HOT", color: "from-red-500 to-amber-500" },
  { id: 2, title: "Trấu cà phê nguyên liệu", desc: "Mua 50kg tặng 10kg - Chỉ áp dụng tuần này", tag: "PROMO", color: "from-emerald-500 to-emerald-600" },
  { id: 3, title: "Sản phẩm thủ công mới", desc: "Túi xách, đệm tatami - Thu thập phương pháp tái chế mới", tag: "NEW", color: "from-amber-500 to-amber-600" },
];

export default function HomePage() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="-mx-4 -mt-12 md:-mt-16 min-h-screen">
      {/* ===== Hero Carousel — chỉ ảnh quảng cáo ===== */}
      <section className="group relative h-[420px] md:h-[520px] overflow-hidden">
        <img
          key={currentBanner.id}
          src={currentBanner.image}
          alt="Farm2Art quảng cáo"
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
        />

        {/* Nav arrows */}
        <button
          type="button"
          onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-md p-3 text-white transition hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 backdrop-blur-md p-3 text-white transition hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentBannerIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBannerIndex ? "bg-white w-8" : "bg-white/40 w-4 hover:bg-white/60"}`}
            />
          ))}
        </div>
      </section>

      {/* ===== Welcome + Stats + CTA ===== */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-white to-stone-50/50">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-10">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="animate-fadeInUp rounded-2xl bg-white p-5 text-center shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <p className="text-2xl md:text-3xl font-extrabold text-emerald-700">{stat.value}</p>
                <p className="mt-1 text-xs text-stone-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* CTA inline */}
          <div className="animate-fadeInUp text-center" style={{ animationDelay: "350ms" }}>
            <p className="text-stone-500 text-sm mb-4">Khám phá sản phẩm phế phẩm nông nghiệp và thủ công mỹ nghệ trên toàn quốc</p>
            <div className="flex gap-3 justify-center">
              <LinkButton href="/search" variant="primary" className="!px-6">
                Khám phá sản phẩm
              </LinkButton>
              <LinkButton href="/about" variant="outline" className="!px-6">
                Về Farm2Art
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Featured Products ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Nổi bật</span>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-stone-800">Sản phẩm bán chạy</h2>
              <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" />
            </div>
            <LinkButton href="/search" variant="ghost" className="text-emerald-600 hover:text-emerald-700 !px-3">
              Xem tất cả 
            </LinkButton>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {featuredProducts.map((product, i) => (
              <Link
                key={product.id}
                href="/search"
                className="group animate-fadeInUp hover-lift rounded-2xl overflow-hidden bg-white border border-sage-200/70 hover:border-emerald-300 transition-all duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative bg-gradient-to-br from-emerald-50/80 to-sage-50/60 p-6 text-center min-h-[110px] flex flex-col items-center justify-center">
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${product.type === "Phế phẩm" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {product.type}
                  </span>
                  <p className="mt-1.5 text-[11px] text-stone-400">{product.stock}</p>
                </div>
                <div className="p-4 space-y-1.5">
                  <h3 className="font-semibold text-stone-800 text-sm line-clamp-2 group-hover:text-emerald-700 transition-colors leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-stone-400">{product.seller}</p>
                  <p className="text-emerald-700 font-bold text-base">{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -left-10 bottom-10 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Quy trình</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-white">Farm2Art hoạt động thế nào?</h2>
          <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400" />

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Đăng sản phẩm", desc: "Người bán đăng phế phẩm hoặc sản phẩm thủ công kèm ảnh và thông tin chi tiết." },
              { step: "02", title: "Kết nối & trao đổi", desc: "Người mua tìm kiếm, chat trực tiếp để thỏa thuận giá cả và vận chuyển." },
              { step: "03", title: "Giao dịch an toàn", desc: "Tạo đơn & thanh toán qua nền tảng, theo dõi giao hàng minh bạch." },
            ].map((item, i) => (
              <div
                key={item.step}
                className="animate-fadeInUp group relative rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-7 hover:bg-white/15 transition-all duration-300"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 border border-white/10">
                  <span className="text-xl font-extrabold text-emerald-300">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-emerald-100/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== News / Promotions ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Cập nhật</span>
            <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-stone-800">Tin tức nổi bật</h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" />
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {promotions.map((news, i) => (
              <Link
                key={news.id}
                href="/news"
                className="group animate-fadeInUp hover-lift rounded-2xl overflow-hidden bg-white border border-sage-200/60 transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`bg-gradient-to-r ${news.color} px-5 py-3`}>
                  <span className="inline-block text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm">
                    {news.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-stone-800 text-base mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-stone-500 text-sm line-clamp-2 mb-4">{news.desc}</p>
                  <span className="text-emerald-600 text-sm font-semibold group-hover:text-emerald-700 inline-flex items-center gap-1">
                    Xem thêm
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 p-10 md:p-14 text-center shadow-xl">
            <div className="absolute inset-0 pattern-dots opacity-10" />
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-300/20 blur-3xl" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                Bắt đầu kinh doanh xanh
              </h2>
              <p className="mt-4 text-emerald-100/80 max-w-lg mx-auto">
                Tham gia Farm2Art ngay hôm nay để kết nối với hàng trăm nông dân và nghệ nhân trên khắp Việt Nam.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
                <LinkButton href="/login" variant="ghost" className="!text-white border border-white/30 hover:!bg-white/10 !px-8 !py-3 text-base">
                  Đăng nhập
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
