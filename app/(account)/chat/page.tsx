"use client";

import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb, firebaseRtdb } from "@/lib/firebase/client";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  DataSnapshot,
  limitToLast,
  onValue,
  push,
  query,
  ref,
  set,
} from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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

function generateRoomId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export default function ChatPage() {
  const { user, loading: authLoading } = useAuthUser();
  const searchParams = useSearchParams();
  const sellerIdParam = searchParams.get("sellerId");
  const productTitle = searchParams.get("product") || "";

  const roomId = useMemo(() => {
    if (!user?.uid) return null;
    if (sellerIdParam) return generateRoomId(user.uid, sellerIdParam);
    return null;
  }, [user?.uid, sellerIdParam]);

  const roomPath = useMemo(() => (roomId ? `rooms/${roomId}/messages` : null), [roomId]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");

  // Load partner info & save conversation metadata
  useEffect(() => {
    if (!sellerIdParam || !user?.uid || !roomId) return;

    async function initConversation() {
      try {
        // Load partner's display name
        const partnerRef = doc(firebaseDb, "users", sellerIdParam!);
        const partnerSnap = await getDoc(partnerRef);
        const pName = partnerSnap.exists()
          ? partnerSnap.data()?.displayName || partnerSnap.data()?.email || "Người dùng"
          : "Người dùng";
        setPartnerName(pName);

        // Save conversation metadata for both participants
        const myName = user!.displayName || user!.email || "Người dùng";
        const convRef = doc(firebaseDb, "conversations", roomId!);
        await setDoc(
          convRef,
          {
            participants: [user!.uid, sellerIdParam],
            participantNames: { [user!.uid]: myName, [sellerIdParam!]: pName },
            productTitle: productTitle || null,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("Init conversation error:", e);
      }
    }
    initConversation();
  }, [sellerIdParam, user?.uid, roomId, productTitle]);

  // Join room + listen to messages
  useEffect(() => {
    if (!roomPath || !roomId || !user?.uid) return;

    let unsubscribe: (() => void) | undefined;

    async function initRoomAndListen() {
      setError(null);
      try {
        // Mark current user as room participant to satisfy RTDB security rules.
        await set(ref(firebaseRtdb, `rooms/${roomId}/participants/${user.uid}`), true);

        const messagesRef = query(ref(firebaseRtdb, roomPath), limitToLast(50));
        unsubscribe = onValue(
          messagesRef,
          (snap) => setMessages(snapshotToMessages(snap)),
          (err) => setError(err.message)
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Không thể tham gia phòng chat");
      }
    }

    void initRoomAndListen();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomPath, roomId, user?.uid]);

  async function sendMessage() {
    const trimmed = text.trim();
    if (!trimmed || !roomPath || !roomId) return;

    setBusy(true);
    setError(null);
    try {
      if (!user?.uid) throw new Error("Vui lòng đăng nhập để gửi tin nhắn");

      const senderId = user.uid;
      const senderName = user.displayName ?? user.phoneNumber ?? user.email ?? "Người dùng";
      const createdAt = Date.now();
      const localId = `local-${createdAt}`;

      // Optimistic render: show message immediately.
      setMessages((prev) => [
        ...prev,
        { id: localId, text: trimmed, senderId, senderName, createdAt },
      ]);

      const newMsgRef = await push(ref(firebaseRtdb, roomPath), {
        text: trimmed,
        senderId,
        senderName,
        createdAt,
      });

      // Replace optimistic id by server key once available.
      setMessages((prev) => {
        const msgId = newMsgRef.key ?? `local-${createdAt}`;
        return prev.map((m) => (m.id === localId ? { ...m, id: msgId } : m));
      });

      // Update conversation lastMessage
      try {
        const convRef = doc(firebaseDb, "conversations", roomId);
        await setDoc(
          convRef,
          { lastMessage: trimmed, lastMessageTime: createdAt, updatedAt: createdAt },
          { merge: true }
        );
      } catch (metaError) {
        console.warn("Update conversation metadata failed:", metaError);
      }

      setText("");
    } catch (e) {
      // Roll back optimistic message if send fails.
      setMessages((prev) => prev.filter((m) => !(m.id.startsWith("local-") && m.text === trimmed)));
      setError(e instanceof Error ? e.message : "Gửi tin nhắn thất bại");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return <div className="py-10 text-center text-stone-600">Đang kiểm tra tài khoản...</div>;
  }

  if (!user) {
    return <div className="py-10 text-center text-stone-600">Vui lòng đăng nhập để sử dụng chat.</div>;
  }

  if (!sellerIdParam) {
    return (
      <div>
        <PageHeader title="Chat" subtitle="Trao đổi trực tiếp giữa người mua và người bán." />
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-stone-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-stone-600 font-medium mb-2">Chưa có cuộc trò chuyện nào</p>
              <p className="text-sm text-stone-500">
                Hãy vào trang sản phẩm và nhấn &quot;Chat với người bán&quot; để bắt đầu trò chuyện.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={partnerName ? `Chat với ${partnerName}` : "Chat"}
        subtitle={productTitle ? `Về sản phẩm: ${productTitle}` : "Trao đổi trực tiếp giữa người mua và người bán."}
      />
      <Card>
        <CardBody>
          <div className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                {error}
                <div className="mt-1 text-xs text-rose-700">
                  Nếu bị &quot;Permission denied&quot;: vào Firebase Console  Realtime Database  Rules và cho phép
                  read/write theo auth.
                </div>
              </div>
            ) : null}

            <div className="h-96 overflow-auto rounded-lg border border-stone-200 bg-white p-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-stone-500">Chưa có tin nhắn. Hãy gửi lời chào!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isMe = m.senderId === user?.uid;
                    return (
                      <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-2xl ${isMe ? "bg-emerald-500 text-white" : "bg-stone-100 text-stone-800"}`}>
                          {!isMe && (
                            <p className="text-xs font-medium mb-1 opacity-75">{m.senderName}</p>
                          )}
                          <p className="text-sm">{m.text}</p>
                          <p className={`text-xs mt-1 ${isMe ? "text-emerald-100" : "text-stone-400"}`}>
                            {m.createdAt ? new Date(m.createdAt).toLocaleTimeString("vi-VN") : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
