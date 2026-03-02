"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { NEWS } from "@/lib/mock/news";
import type { NewsItem } from "@/lib/mock/news";

function NewsImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sage-100">
        <div className="text-center">
          <span className="text-4xl">📰</span>
          <p className="mt-2 text-sm text-stone-500">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setError(true)}
    />
  );
}

export default function NewsPage() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  return (
    <div className="animate-fadeIn">
      <PageHeader
        title="Tin tức"
        subtitle="Cập nhật hoạt động, hướng dẫn sử dụng và các khuyến nghị giao dịch an toàn"
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {NEWS.map((item, i) => (
            <button
              key={item.slug}
              onClick={() => setSelectedNews(item)}
              className="text-left hover-lift focus:outline-none animate-fadeInUp"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Card className="h-full !shadow-md hover:!shadow-xl">
                <div className="relative h-48 w-full overflow-hidden bg-stone-50">
                  <NewsImage src={item.image} alt={item.title} />
                </div>
                <CardBody>
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-stone-800 line-clamp-2 hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-stone-500 line-clamp-2">
                    {item.excerpt}
                  </p>
                  <div className="mt-4 flex items-center text-emerald-700 font-semibold text-sm">
                    Đọc thêm <span className="ml-2">→</span>
                  </div>
                </CardBody>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={!!selectedNews}
        onClose={() => setSelectedNews(null)}
        title={selectedNews?.title || ""}
        size="xl"
      >
        {selectedNews && (
          <div className="space-y-6">
            {/* Thumbnail */}
            <div className="relative h-80 w-full overflow-hidden rounded-lg bg-stone-100">
              <NewsImage src={selectedNews.image} alt={selectedNews.title} />
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4">
              <span className="inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
                📅 {new Date(selectedNews.date).toLocaleDateString("vi-VN")}
              </span>
            </div>

            {/* Excerpt */}
            <p className="text-base text-stone-600 italic border-l-4 border-emerald-400 pl-4">
              &ldquo;{selectedNews.excerpt}&rdquo;
            </p>

            {/* Content sections */}
            <div className="space-y-6">
              {selectedNews.content.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-semibold text-stone-800 mb-3">
                    {section.heading}
                  </h3>
                  <p className="text-stone-600 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-200 pt-4 text-center">
              <p className="text-sm text-stone-500">
                Farm2Art - Trao giá trị mới cho phụ phẩm nông nghiệp
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
