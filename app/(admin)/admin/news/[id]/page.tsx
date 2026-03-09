"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import type { NewsArticle } from "@/types/news";

export default function CreateEditNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params.id as string) || null;
  const articleId = id && id !== "new" ? id : null;
  const isCreating = !articleId;
  const { user, loading: userLoading } = useAuthUser();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoading && !user) router.push("/login");
  }, [user, userLoading, router]);

  // Load article if editing
  useEffect(() => {
    if (articleId) {
      loadArticle();
    }
  }, [articleId]);

  async function loadArticle() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/news?id=${articleId}`);
      const data = await res.json();
      const article = data.articles?.[0];
      if (article) {
        setTitle(article.title);
        setSlug(article.slug);
        setExcerpt(article.excerpt);
        setContent(article.content);
        setImage(article.image);
        setStatus(article.status);
        setCategory(article.category || "");
      }
    } catch (error) {
      console.error("❌ Error loading article:", error);
      setToast("Lỗi tải bài viết");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !articleId) {
      const generatedSlug = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, articleId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !excerpt || !content) {
      setToast("❌ Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...(articleId && { id: articleId }),
        title,
        slug,
        excerpt,
        content,
        image,
        status,
        category,
        ...((!articleId) && { createdBy: user?.uid }),
      };

      const res = await fetch("/api/admin/news", {
        method: articleId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast("✅ " + (articleId ? "Cập nhật" : "Tạo") + " tin tức thành công");
        setTimeout(() => router.push("/admin/news"), 1500);
      } else {
        setToast("❌ Lỗi lưu tin tức");
      }
    } catch (error) {
      console.error("❌ Error saving article:", error);
      setToast("❌ Lỗi lưu tin tức");
    } finally {
      setSaving(false);
    }
  }

  if (userLoading || loading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-stone-800 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-stone-900">
          {articleId ? "Chỉnh sửa tin tức" : "Tạo tin tức mới"}
        </h1>
        <p className="text-stone-500 mt-1">
          {articleId ? "Cập nhật bài viết tin tức" : "Tạo một bài viết tin tức mới"}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-stone-200">
        {/* Title */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Tiêu đề *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nhập tiêu đề tin tức"
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Slug (URL)
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated-slug"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <p className="text-xs text-stone-500 mt-1">Sẽ tự động tạo từ tiêu đề</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Trích dẫn *
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Nhập trích dẫn ngắn (1-2 dòng)"
            required
            rows={2}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Nội dung *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung tin tức (hỗ trợ HTML hoặc Markdown)"
            required
            rows={10}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono text-sm"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Hình ảnh (URL)
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {image && (
            <div className="mt-3">
              <img src={image} alt="Preview" className="max-h-48 rounded-lg object-cover" />
            </div>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Danh mục
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., Hướng dẫn, Tin khám phá, Cập nhật"
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-semibold text-stone-900 mb-2">
            Trạng thái
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="draft"
                checked={status === "draft"}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="rounded-full"
              />
              <span className="ml-2 text-sm text-stone-700">Nháp</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="published"
                checked={status === "published"}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="rounded-full"
              />
              <span className="ml-2 text-sm text-stone-700">Xuất bản ngay</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            {saving ? "Đang lưu..." : (articleId ? "Cập nhật" : "Tạo tin tức")}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/news")}
            className="bg-stone-200 hover:bg-stone-300 text-stone-900 px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
