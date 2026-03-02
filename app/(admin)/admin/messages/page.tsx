"use client";

import { useEffect, useState, useRef } from "react";

interface CustomerMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  isAdmin: boolean;
}
interface ConversationData {
  [userId: string]: CustomerMessage[];
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ConversationData>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await fetch("/api/admin-chat?all=true");
        if (res.ok) {
          const data = await res.json();
          setConversations(data.conversations || {});
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUserId, conversations]);

  async function handleSendReply() {
    if (!replyMessage.trim() || !selectedUserId) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin-chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUserId, message: replyMessage }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      setReplyMessage("");
      const refreshRes = await fetch("/api/admin-chat?all=true");
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setConversations(data.conversations || {});
      }
      showToast("Đã gửi phản hồi");
    } catch (err) {
      console.error(err);
      showToast("Lỗi gửi tin nhắn");
    } finally {
      setSending(false);
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

  const conversationEntries = Object.entries(conversations)
    .filter(([, msgs]) => {
      if (!search) return true;
      const name = msgs[msgs.length - 1]?.userName || "";
      return name.toLowerCase().includes(search.toLowerCase());
    })
    .sort(([, a], [, b]) => (b[b.length - 1]?.timestamp || 0) - (a[a.length - 1]?.timestamp || 0));

  const selectedMessages = selectedUserId ? conversations[selectedUserId] || [] : [];
  const selectedUserName = selectedMessages[selectedMessages.length - 1]?.userName || "Khách hàng";
  const totalMessages = Object.values(conversations).reduce((s, m) => s + m.length, 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-emerald-100/50" />
        <div className="h-[500px] bg-white/80 rounded-2xl border border-sage-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-dark text-white px-5 py-3 rounded-2xl text-sm shadow-xl animate-fadeInDown font-medium">{toast}</div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 px-6 md:px-8 py-8 shadow-lg overflow-hidden animate-fadeInUp">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 mb-2">Hỗ trợ</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Tin nhắn</h1>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
            <p className="text-sm text-emerald-100/70 mt-3">{conversationEntries.length} cuộc hội thoại — {totalMessages} tin nhắn</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5 text-center">
              <p className="text-lg font-extrabold text-amber-300">{conversationEntries.length}</p>
              <p className="text-[10px] text-emerald-200/80 font-medium">Cuộc trò chuyện</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="animate-fadeInUp flex flex-col lg:flex-row gap-4 h-[600px]" style={{ animationDelay: '150ms' }}>
        {/* Sidebar — Conversation list */}
        <div className="w-full lg:w-80 flex-shrink-0 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm overflow-hidden flex flex-col">
          {/* Search header */}
          <div className="p-3 border-b border-sage-100/60">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm khách hàng..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-sage-300 bg-white/90 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" />
            </div>
          </div>

          {/* Conversation entries */}
          <div className="flex-1 overflow-y-auto">
            {conversationEntries.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4 text-center text-stone-400 text-sm">
                <div>
                  <svg className="w-10 h-10 mx-auto mb-2 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chưa có tin nhắn
                </div>
              </div>
            ) : (
              <div className="p-1.5 space-y-0.5">
                {conversationEntries.map(([userId, msgs]) => {
                  const lastMsg = msgs[msgs.length - 1];
                  const isSelected = selectedUserId === userId;
                  const customerName = lastMsg?.userName || "Khách";
                  return (
                    <button key={userId} onClick={() => setSelectedUserId(userId)}
                      className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 ${isSelected ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20" : "hover:bg-emerald-50/60 group"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"}`}>
                          {customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-bold truncate ${isSelected ? "text-white" : "text-stone-800"}`}>{customerName}</p>
                            <span className={`text-[10px] flex-shrink-0 ${isSelected ? "text-emerald-200" : "text-stone-400"}`}>{fmtTime(lastMsg?.timestamp || 0)}</span>
                          </div>
                          <p className={`text-xs truncate mt-0.5 ${isSelected ? "text-emerald-100" : "text-stone-400"}`}>
                            {lastMsg?.isAdmin ? "Admin: " : ""}{lastMsg?.message || "..."}
                          </p>
                          <p className={`text-[10px] mt-1 ${isSelected ? "text-emerald-200/70" : "text-stone-300"}`}>{msgs.length} tin nhắn</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm overflow-hidden flex flex-col">
          {selectedUserId ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-4 border-b border-sage-100/60 bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                    {selectedUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">{selectedUserName}</p>
                    <p className="text-xs text-stone-400">{selectedMessages.length} tin nhắn — ID: <span className="font-mono text-[10px]">{selectedUserId.slice(0, 10)}...</span></p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gradient-to-b from-sage-50/30 to-white/50">
                {selectedMessages.map((msg, idx) => {
                  const showDate = idx === 0 || fmtDate(msg.timestamp) !== fmtDate(selectedMessages[idx - 1].timestamp);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-sage-200/50" />
                          <span className="text-[10px] font-medium text-stone-400 bg-sage-50 px-2 py-0.5 rounded-full">{fmtDate(msg.timestamp)}</span>
                          <div className="flex-1 h-px bg-sage-200/50" />
                        </div>
                      )}
                      <div className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] px-4 py-3 text-sm ${msg.isAdmin
                          ? "bg-white border border-sage-200/60 rounded-2xl rounded-bl-sm text-stone-700 shadow-sm"
                          : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-emerald-500/10"}`}>
                          {msg.isAdmin && <p className="text-[10px] font-bold text-emerald-600 mb-1">Admin</p>}
                          <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          <p className={`text-[10px] mt-1.5 ${msg.isAdmin ? "text-stone-400" : "text-emerald-200"}`}>{fmtTime(msg.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply input */}
              <div className="border-t border-sage-100/60 p-4 bg-white/80">
                <div className="flex gap-2">
                  <textarea value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                    placeholder="Nhập phản hồi..."
                    disabled={sending}
                    rows={2}
                    className="flex-1 px-4 py-3 text-sm rounded-2xl border border-sage-300 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none transition-all placeholder:text-stone-400" />
                  <button onClick={handleSendReply} disabled={sending || !replyMessage.trim()}
                    className="px-5 py-3 rounded-2xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-40 transition-all duration-200 active:scale-[0.97] self-end">
                    {sending ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : "Gửi"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-cream-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-stone-700">Chọn cuộc hội thoại</p>
                <p className="text-xs text-stone-400 mt-1">Chọn khách hàng từ danh sách bên trái để xem tin nhắn</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
