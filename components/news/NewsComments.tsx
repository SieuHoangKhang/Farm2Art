'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timestamp: number;
  likes: number;
  replies: Comment[];
  userId: string;
}

interface CommentsProps {
  articleId: string;
}

export default function NewsComments({ articleId }: CommentsProps) {
  const { user } = useAuthUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    try {
      // Mock comments
      const mockComments: Comment[] = [
        {
          id: 'cmt_1',
          author: 'Nguyễn Văn A',
          content: 'Bài viết rất hữu ích, cảm ơn tác giả!',
          timestamp: Date.now() - 1000 * 60 * 30,
          likes: 5,
          userId: 'user_1',
          replies: [
            {
              id: 'cmt_1_1',
              author: 'Trần Thị B',
              content: 'Tôi cũng đồng ý, rất hay!',
              timestamp: Date.now() - 1000 * 60 * 20,
              likes: 2,
              userId: 'user_2',
              replies: [],
            },
          ],
        },
        {
          id: 'cmt_2',
          author: 'Lê Minh C',
          content: 'Có thể bạn nên thêm thêm thông tin về chi phí?',
          timestamp: Date.now() - 1000 * 60 * 10,
          likes: 1,
          userId: 'user_3',
          replies: [],
        },
      ];
      setComments(mockComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      author: user.displayName || 'Guest',
      content: newComment,
      timestamp: Date.now(),
      likes: 0,
      userId: user.uid,
      replies: [],
    };

    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim() || !user) return;

    const reply: Comment = {
      id: `cmt_${Date.now()}`,
      author: user.displayName || 'Guest',
      content: replyText,
      timestamp: Date.now(),
      likes: 0,
      userId: user.uid,
      replies: [],
    };

    setComments(
      comments.map(c =>
        c.id === commentId
          ? { ...c, replies: [reply, ...c.replies] }
          : c
      )
    );

    setReplyingTo(null);
    setReplyText('');
  };

  const renderComment = (comment: Comment, level = 0) => (
    <div key={comment.id} className={`${level > 0 ? 'ml-8' : ''} mb-4`}>
      <div className="bg-sage-50 rounded-lg p-4 border border-sage-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
            {comment.author[0]}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <p className="font-semibold text-stone-800">{comment.author}</p>
              <p className="text-xs text-stone-500">
                {new Date(comment.timestamp).toLocaleTimeString('vi-VN')}
              </p>
            </div>
            <p className="text-stone-600 text-sm mb-3">{comment.content}</p>
            <div className="flex gap-4 text-xs">
              <button className="text-stone-500 hover:text-emerald-600">
                Thích ({comment.likes})
              </button>
              {level === 0 && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-stone-500 hover:text-emerald-600"
                >
                  Trả lời
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {replyingTo === comment.id && (
        <div className="ml-8 mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Nhập câu trả lời..."
            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAddReply(comment.id)}
              className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600"
            >
              Gửi
            </button>
            <button
              onClick={() => setReplyingTo(null)}
              className="px-3 py-1 bg-stone-300 text-stone-600 rounded text-sm hover:bg-stone-400"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(reply => renderComment(reply, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <section className="mt-12 pt-8 border-t border-sage-200">
      <h2 className="text-2xl font-bold text-stone-800 mb-6">Bình luận</h2>

      {/* Add Comment Form */}
      {user ? (
        <div className="mb-8 p-4 bg-sage-50 rounded-lg border border-sage-200">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Chia sẻ ý kiến của bạn..."
            className="w-full px-4 py-3 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            rows={3}
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-stone-300 font-medium"
            >
              Gửi bình luận
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
          <p className="text-stone-800">
            Vui lòng <a href="/login" className="font-semibold hover:underline">đăng nhập</a> để bình luận
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => renderComment(comment))}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-500">
          Chưa có bình luận nào. Hãy là người bình luận đầu tiên!
        </div>
      )}
    </section>
  );
}
