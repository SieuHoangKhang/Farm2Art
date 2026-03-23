"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import type { NewsArticle } from "@/types/news";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

// Carousel banner data
const banners = [
  { id: 1, image: "/anhquangcao-1.png" },
  { id: 2, image: "/anhquangcao-2.png" },
  { id: 3, image: "/anhquangcao-3.png" },
];

interface FeaturedProduct {
  id: string;
  name: string;
  price: string;
  type: string;
  seller: string;
  stock: string;
  image?: string;
}

const newsGradients = [
  "from-red-500 to-amber-500",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
];

async function fetchFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    const listingsSnapshot = await getDocs(
      query(collection(firebaseDb, "listings"), orderBy("createdAt", "desc"), limit(12))
    );

    const products: FeaturedProduct[] = [];
    for (const listingSnap of listingsSnapshot.docs) {
      const listingId = listingSnap.id;
      const listing = listingSnap.data() as any;

      if (listing.status !== "active" || listing.approvalStatus !== "approved") {
        continue;
      }

      let sellerName = listing.sellerName || "Người bán";
      if (listing.sellerId) {
        const sellerSnap = await getDocs(
          query(collection(firebaseDb, "users"), where("uid", "==", listing.sellerId), limit(1))
        );
        if (!sellerSnap.empty) {
          sellerName = sellerSnap.docs[0].data().displayName || sellerSnap.docs[0].data().email || sellerName;
        }
      }

      const firstImage = Array.isArray(listing.images) && listing.images.length > 0
        ? typeof listing.images[0] === "string"
          ? listing.images[0]
          : listing.images[0]?.secureUrl
        : "";

      products.push({
        id: listingId,
        name: listing.title || "Sản phẩm không tên",
        price: listing.price ? `${listing.price.toLocaleString("vi-VN")}đ` : "Liên hệ",
        type: listing.type === "art" ? "Thủ công" : "Phế phẩm",
        seller: sellerName,
        stock: `${listing.quantity || 0} ${listing.unit || "cái"}`,
        image: firstImage || undefined,
      });

      if (products.length === 3) {
        break;
      }
    }

    return products;
  } catch (error) {
    console.error("Lỗi fetch sản phẩm tiêu biểu:", error);
    return [];
  }
}

export default function HomePage() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]); // Khởi tạo rỗng, không fallback
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoadingProducts(true);
    fetchFeaturedProducts().then((products) => {
      setFeaturedProducts(products);
      setLoadingProducts(false);
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFeaturedNews() {
      try {
        const res = await fetch("/api/news", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load featured news");
        }

        if (active) {
          setFeaturedNews((data.articles || []).slice(0, 3));
        }
      } catch (error) {
        console.error("Lỗi tải tin tức nổi bật:", error);
        if (active) {
          setFeaturedNews([]);
        }
      } finally {
        if (active) {
          setLoadingNews(false);
        }
      }
    }

    loadFeaturedNews();

    return () => {
      active = false;
    };
  }, []);

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="-mx-4 -mt-12 md:-mt-16 min-h-screen">
      {/* ===== Hero Carousel — chỉ ảnh quảng cáo ===== */}
      <section className="group relative h-[420px] md:h-[520px] overflow-hidden">
        <Image
          key={currentBanner.id}
          src={currentBanner.image}
          alt="Farm2Art quảng cáo"
          fill
          className="object-cover transition-all duration-700"
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

      {/* ===== Intro spacing ===== */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-white to-stone-50/50">
        <div className="max-w-6xl mx-auto" />
      </section>

      {/* ===== Featured Products ===== */}
      {!loadingProducts && featuredProducts.length > 0 && (
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Nổi bật</span>
                <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-stone-800">Sản phẩm tiêu biểu</h2>
                <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" />
              </div>
              <LinkButton href="/search" variant="ghost" className="text-emerald-600 hover:text-emerald-700 !px-3">
                Xem tất cả
              </LinkButton>
            </div>

            <div className={`grid gap-4 md:gap-5 ${featuredProducts.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : featuredProducts.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" : "grid-cols-1 md:grid-cols-3"}`}>
              {featuredProducts.map((product, i) => (
                <Link
                  key={product.id}
                  href={`/listing/${product.id}`}
                  className="group animate-fadeInUp hover-lift rounded-2xl overflow-hidden bg-white border border-sage-200/70 hover:border-emerald-300 transition-all duration-300"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="relative h-52 overflow-hidden bg-gradient-to-br from-emerald-50/80 to-sage-50/60">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-stone-400 text-sm">
                        Chưa có hình ảnh
                      </div>
                    )}
                    <div className="absolute left-4 top-4">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${product.type === "Phế phẩm" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {product.type}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-semibold text-stone-800 text-base line-clamp-2 group-hover:text-emerald-700 transition-colors leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-sm text-stone-400">{product.seller}</p>
                    <p className="text-xs text-stone-500">Số lượng: {product.stock}</p>
                    <p className="text-emerald-700 font-bold text-base">{product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {loadingProducts && (
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Nổi bật</span>
                <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-stone-800">Sản phẩm tiêu biểu</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
              {Array(3).fill(0).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl overflow-hidden bg-white border border-sage-200/70"
                >
                  <div className="bg-stone-200 h-[208px]" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-200 rounded w-1/2" />
                    <div className="h-3 bg-stone-200 rounded w-2/3" />
                    <div className="h-5 bg-stone-300 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== News / Promotions ===== */}
      {!loadingNews && featuredNews.length > 0 && (
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Cập nhật</span>
              <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-stone-800">Tin tức nổi bật</h2>
              <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" />
            </div>

            <div className={`grid gap-5 ${featuredNews.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : featuredNews.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-3"}`}>
              {featuredNews.map((news, i) => (
                <Link
                  key={news.id}
                  href={news.slug ? `/news/${news.slug}` : "/news"}
                  className="group animate-fadeInUp hover-lift rounded-2xl overflow-hidden bg-white border border-sage-200/60 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`bg-gradient-to-r ${newsGradients[i % newsGradients.length]} px-5 py-3`}>
                    <span className="inline-block text-white text-xs font-bold px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-sm uppercase">
                      {news.category || "NEWS"}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-stone-800 text-base mb-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {news.title}
                    </h3>
                    <p className="text-stone-500 text-sm line-clamp-2 mb-4">{news.excerpt}</p>
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
      )}

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

      {/* ===== Mission ===== */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-white to-stone-50/70">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Định hướng</span>
            <h2 className="mt-1 text-3xl md:text-4xl font-extrabold text-stone-800">Mục tiêu của Farm2Art</h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-amber-400" />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Kết nối nguồn lực xanh",
                description:
                  "Farm2Art hướng đến việc kết nối người có phụ phẩm nông nghiệp với cá nhân và đơn vị có nhu cầu tái sử dụng, từ đó hình thành một kênh giao dịch rõ ràng, thuận tiện và dễ tiếp cận hơn.",
              },
              {
                title: "Gia tăng giá trị phụ phẩm",
                description:
                  "Nền tảng đặt mục tiêu góp phần biến các nguồn nguyên liệu tưởng như bị bỏ đi thành sản phẩm có giá trị sử dụng và giá trị kinh tế, đồng thời khuyến khích các mô hình sáng tạo dựa trên tái chế và thủ công.",
              },
              {
                title: "Phát triển hệ sinh thái bền vững",
                description:
                  "Farm2Art không chỉ hỗ trợ mua bán trực tuyến mà còn hướng đến xây dựng một cộng đồng quan tâm đến tiêu dùng xanh, sản xuất bền vững và lan tỏa nhận thức về việc tận dụng hiệu quả phụ phẩm nông nghiệp.",
              },
            ].map((item, index) => (
              <div
                key={item.title}
                className="animate-fadeInUp rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-lg font-extrabold text-emerald-700">
                  {index + 1}
                </div>
                <h3 className="text-lg font-bold text-stone-800">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
