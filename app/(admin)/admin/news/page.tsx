"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import type { NewsArticle } from "@/types/news";

export default function AdminNewsPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuthUser();
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userLoading && !user) router.push("/login");
  }, [user, userLoading, router]);

  useEffect(() => {
    loadArticles();
  }, [statusFilter]);

  async function loadArticles() {
    try {
      setLoading(true);
      const url = new URL("/api/admin/news", window.location.origin);
      if (statusFilter !== "all") {
        url.searchParams.set("status", statusFilter);
      }
      
      const res = await fetch(url);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("❌ Error loading articles:", error);
      setToast("Lỗi tải danh sách tin tức");
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm("Bạn chắc chắn muốn xóa tin tức này?")) return;

    try {
      const res = await fetch(`/api/admin/news?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setArticles(articles.filter(a => a.id !== id));
        setToast("✅ Xóa tin tức thành công");
      }
    } catch (error) {
      console.error("❌ Error deleting article:", error);
      setToast("❌ Lỗi xóa tin tức");
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch("/api/admin/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setArticles(articles.map(a => a.id === id ? { ...a, status: newStatus as any } : a));
        setToast("✅ Cập nhật thành công");
      }
    } catch (error) {
      console.error("❌ Error updating status:", error);
      setToast("❌ Lỗi cập nhật");
    }
  }

  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    return status === "draft" ? "Nháp" : status === "published" ? "Đã xuất bản" : "Lưu trữ";
  };

  const getStatusColor = (status: string) => {
    return status === "draft" ? "bg-gray-100 text-gray-700" : status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
  };

  if (userLoading) {
    return <div className="p-6 text-center">Đang tải...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-stone-800 text-white px-4 py-3 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Quản lý tin tức</h1>
          <p className="text-stone-500 mt-1">Đăng và quản lý các bài viết tin tức</p>
        </div>
        <button
          onClick={() => router.push("/admin/news/create")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          + Tạo tin tức mới
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          placeholder="Tìm kiếm tin tức..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-stone-300 rounded-lg flex-1 min-w-48"
        />
        <div className="flex gap-2">
          {(["all", "draft", "published", "archived"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === status
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              {status === "all" ? "Tất cả" : status === "draft" ? "Nháp" : status === "published" ? "Đã xuất bản" : "Lưu trữ"}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-stone-500">Đang tải...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-6 text-center text-stone-500">Không có tin tức nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900">Tiêu đề</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900">Trích dẫn</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-stone-900">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-stone-900 font-medium max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600 max-w-xs truncate">
                      {article.excerpt.substring(0, 50)}...
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(article.status)}`}>
                        {getStatusLabel(article.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      {new Date(article.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => router.push(`/admin/news/edit/${article.id}`)}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = article.status === "published" ? "draft" : "published";
                          updateStatus(article.id, newStatus);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        {article.status === "published" ? "Ẩn" : "Xuất bản"}
                      </button>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
