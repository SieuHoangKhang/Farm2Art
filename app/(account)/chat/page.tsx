"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { firebaseAuth, firebaseRtdb } from "@/lib/firebase/client";
import {
  DataSnapshot,
  limitToLast,
  onValue,
  push,
  query,
  ref,
  serverTimestamp,
} from "firebase/database";
import { useEffect, useMemo, useState } from "react";

type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt?: number;
};

function snapshotToMessages(snapshot: DataSnapshot): ChatMessage[] {
  const val = snapshot.val() as Record<string, any> | null;
  if (!val) return [];
  const messages: ChatMessage[] = Object.entries(val).map(([id, m]) => ({
    id,
    text: String(m?.text ?? ""),
    senderId: String(m?.senderId ?? ""),
    senderName: String(m?.senderName ?? ""),
    createdAt: typeof m?.createdAt === "number" ? m.createdAt : undefined,
  }));
  messages.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  return messages;
}

export default function ChatPage() {
  const user = firebaseAuth.currentUser;
  const roomId = "demo";
  const roomPath = useMemo(() => `rooms/${roomId}/messages`, [roomId]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    const messagesRef = query(ref(firebaseRtdb, roomPath), limitToLast(50));
    const unsubscribe = onValue(
      messagesRef,
      (snap) => setMessages(snapshotToMessages(snap)),
      (err) => setError(err.message)
    );
    return () => unsubscribe();
  }, [roomPath]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      const senderId = user?.uid ?? "guest";
      const senderName = user?.displayName ?? user?.phoneNumber ?? user?.email ?? "Guest";

      await push(ref(firebaseRtdb, roomPath), {
        text: trimmed,
        senderId,
        senderName,
        createdAt: serverTimestamp(),
      });

      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi tin nhắn thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Chat" subtitle="Trao đổi trực tiếp giữa người mua và người bán." />
      <Card>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-stone-900">Phòng chat: {roomId}</p>
              <p className="text-xs text-stone-500">
                RTDB path: <span className="font-mono">{roomPath}</span>
              </p>
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                {error}
                <div className="mt-1 text-xs text-rose-700">
                  Nếu bị &quot;Permission denied&quot;: vào Firebase Console → Realtime Database → Rules và cho phép
                  read/write theo auth (hoặc tạm thời mở khi demo).
                </div>
              </div>
            ) : null}

            <div className="h-72 overflow-auto rounded-lg border border-stone-200 bg-white p-3">
              {messages.length === 0 ? (
                <p className="text-sm text-stone-600">Chưa có tin nhắn. Gửi thử một tin để kiểm tra realtime.</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className="rounded-md bg-emerald-50 p-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-stone-900">{m.senderName || m.senderId}</p>
                        <p className="text-xs text-stone-500">
                          {m.createdAt ? new Date(m.createdAt).toLocaleString("vi-VN") : ""}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-stone-700">{m.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <TextField
                  label="Tin nhắn"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập nội dung..."
                  disabled={busy}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void sendMessage();
                    }
                  }}
                />
              </div>
              <Button onClick={() => void sendMessage()} disabled={busy || text.trim().length === 0}>
                {busy ? "Đang gửi..." : "Gửi"}
              </Button>
            </div>

            <p className="text-xs text-stone-500">
              Mẹo test realtime: mở 2 tab cùng phòng chat, gửi tin và xem cập nhật tức thời.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
