"use client";

import { useEffect, useState, useRef } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, addDoc, query, orderBy, onSnapshot, doc, updateDoc, Timestamp,
} from "firebase/firestore";

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: "open" | "closed";
  createdAt: number;
  lastMessage?: string;
  unread?: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  createdAt: number;
}

export default function AdminMessagesPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTicket, setActiveTicket] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadTickets(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadTickets() {
    try {
      const snap = await getDocs(query(collection(firebaseDb, "supportTickets"), orderBy("createdAt", "desc")));
      setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SupportTicket)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeTicket) { setMessages([]); return; }
    const unsub = onSnapshot(
      query(collection(firebaseDb, "supportTickets", activeTicket, "messages"), orderBy("createdAt", "asc")),
      (snap) => { setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Message))); }
    );
    return () => unsub();
  }, [activeTicket]);

  async function sendReply() {
    if (!reply.trim() || !activeTicket) return;
    try {
      setSending(true);
      await addDoc(collection(firebaseDb, "supportTickets", activeTicket, "messages"), {
        text: reply.trim(),
        senderId: "admin",
        senderName: "Admin",
        isAdmin: true,
        createdAt: Date.now(),
      });
      await updateDoc(doc(firebaseDb, "supportTickets", activeTicket), { lastMessage: reply.trim() });
      setReply("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function toggleTicketStatus(ticketId: string, current: string) {
    const next = current === "open" ? "closed" : "open";
    try {
      await updateDoc(doc(firebaseDb, "supportTickets", ticketId), { status: next });
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status: next as "open" | "closed" } : t));
    } catch (err) {
      console.error(err);
    }
  }

  const fmtTime = (ts: number) => new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const filtered = tickets.filter((t) => filter === "all" || t.status === filter);
  const openCount = tickets.filter((t) => t.status === "open").length;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded-lg w-56" />
        <div className="grid grid-cols-3 gap-4 h-[500px]">
          <div className="bg-white rounded-xl border border-stone-200" />
          <div className="col-span-2 bg-white rounded-xl border border-stone-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Tin nhắn hỗ trợ</h1>
        <p className="text-sm text-stone-500 mt-0.5">{tickets.length} cuộc hội thoại — {openCount} đang mở</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[400px]">
        {/* Sidebar – ticket list */}
        <div className="bg-white rounded-2xl border border-stone-200/80 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-stone-100">
            <div className="flex gap-1 bg-stone-50 rounded-lg p-0.5">
              {(["all", "open", "closed"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white shadow-sm text-stone-800" : "text-stone-500 hover:text-stone-700"}`}>
                  {f === "all" ? "Tất cả" : f === "open" ? "Đang mở" : "Đã đóng"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {filtered.length === 0 ? (
              <p className="p-4 text-center text-xs text-stone-400">Chưa có tin nhắn</p>
            ) : filtered.map((t) => (
              <button key={t.id} onClick={() => setActiveTicket(t.id)}
                className={`w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors ${activeTicket === t.id ? "bg-emerald-50 border-l-2 border-emerald-500" : ""}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-stone-700 truncate">{t.userName || t.userId.slice(0, 10)}</p>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.status === "open" ? "bg-emerald-400" : "bg-stone-300"}`} />
                </div>
                <p className="text-xs text-stone-500 truncate mt-0.5">{t.subject || t.lastMessage || "..."}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{fmtTime(t.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main – chat area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200/80 flex flex-col overflow-hidden">
          {!activeTicket ? (
            <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
              Chọn một cuộc hội thoại để xem
            </div>
          ) : (
            <>
              {/* Chat header */}
              {(() => {
                const t = tickets.find((t) => t.id === activeTicket);
                return t ? (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                    <div>
                      <p className="text-sm font-semibold text-stone-700">{t.userName || t.userId.slice(0, 16)}</p>
                      <p className="text-xs text-stone-400">{t.subject || "Hỗ trợ"}</p>
                    </div>
                    <button onClick={() => toggleTicketStatus(t.id, t.status)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${t.status === "open" ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100" : "border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100"}`}>
                      {t.status === "open" ? "Đóng ticket" : "Mở lại"}
                    </button>
                  </div>
                ) : null;
              })()}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-stone-400 py-8">Chưa có tin nhắn</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${m.isAdmin ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-700"}`}>
                      <p className="text-sm">{m.text}</p>
                      <p className={`text-[10px] mt-1 ${m.isAdmin ? "text-emerald-100" : "text-stone-400"}`}>{fmtTime(m.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Reply input */}
              <div className="border-t border-stone-100 p-3 flex gap-2">
                <input
                  type="text" value={reply} onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm">
                  Gửi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
