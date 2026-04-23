import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FORUM_API, apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Topic, Post } from "@/lib/types";
import PostCard from "@/components/forum/PostCard";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TopicResponse { topic: Topic }
interface PostsResponse { posts: Post[]; total: number; page: number; per_page: number }

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState("");

  const { data: topicData, isLoading: topicLoading } = useQuery<TopicResponse>({
    queryKey: ["topic", id],
    queryFn: () => apiFetch(FORUM_API, `/topics/${id}`),
    enabled: !!id,
  });

  const { data: postsData, isLoading: postsLoading } = useQuery<PostsResponse>({
    queryKey: ["posts", id, page],
    queryFn: () => apiFetch(FORUM_API, `/topics/${id}/posts?page=${page}&per_page=20`),
    enabled: !!id,
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch(FORUM_API, `/topics/${id}/posts`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", id] });
      queryClient.invalidateQueries({ queryKey: ["topic", id] });
      setReply("");
      setReplyError("");
      // Go to last page
      if (postsData) {
        const newTotal = postsData.total + 1;
        const lastPage = Math.ceil(newTotal / postsData.per_page);
        setPage(lastPage);
      }
    },
    onError: (err: { error?: string }) => {
      setReplyError(err?.error ?? "Ошибка отправки сообщения");
    },
  });

  const topic = topicData?.topic;
  const totalPages = postsData ? Math.ceil(postsData.total / postsData.per_page) : 1;

  const canReply = user && !user.is_banned && !user.is_muted && topic && !topic.is_locked;

  const handleReply = () => {
    setReplyError("");
    if (!reply.trim()) { setReplyError("Сообщение не может быть пустым"); return; }
    createPostMutation.mutate(reply.trim());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/" className="hover:text-purple-400 transition-colors">Главная</Link>
        <Icon name="ChevronRight" size={14} />
        {topic && (
          <>
            <Link to={`/category/${topic.category_id}`} className="hover:text-purple-400 transition-colors">
              Категория
            </Link>
            <Icon name="ChevronRight" size={14} />
          </>
        )}
        <span className="text-foreground truncate max-w-xs">{topic?.title ?? "Топик"}</span>
      </div>

      {/* Topic header */}
      {topicLoading ? (
        <div className="glass rounded-xl h-24 animate-pulse mb-6" />
      ) : topic ? (
        <div className="glass-strong rounded-xl p-6 mb-6 animate-slide-up border border-white/10">
          <div className="flex items-start gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold font-exo text-foreground">{topic.title}</h1>
                {topic.is_pinned && (
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                    <Icon name="Pin" size={10} /> Закреплён
                  </span>
                )}
                {topic.is_locked && (
                  <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                    <Icon name="Lock" size={10} /> Закрыт
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Icon name="User" size={11} /> {topic.username}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Eye" size={11} /> {topic.views} просмотров
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="MessageCircle" size={11} /> {topic.reply_count} ответов
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Posts */}
      {postsLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {postsData?.posts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="glass border-white/10"
          >
            <Icon name="ChevronLeft" size={14} />
          </Button>
          {[...Array(Math.min(totalPages, 10))].map((_, i) => (
            <Button
              key={i}
              variant="outline" size="sm"
              onClick={() => setPage(i + 1)}
              className={`glass border-white/10 ${page === i + 1 ? "bg-purple-600/30 border-purple-500/50 text-purple-300" : ""}`}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline" size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="glass border-white/10"
          >
            <Icon name="ChevronRight" size={14} />
          </Button>
        </div>
      )}

      {/* Reply form */}
      <div className="mt-10">
        {!user ? (
          <div className="glass rounded-xl p-6 text-center border border-white/10">
            <Icon name="MessageSquare" size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground mb-3">Чтобы ответить, нужно войти в аккаунт</p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-sm font-medium glow-purple"
            >
              <Icon name="LogIn" size={14} /> Войти
            </Link>
          </div>
        ) : topic?.is_locked ? (
          <div className="glass rounded-xl p-6 text-center border border-red-500/20">
            <Icon name="Lock" size={28} className="text-red-400 mx-auto mb-2 opacity-60" />
            <p className="text-muted-foreground text-sm">Топик закрыт — отвечать нельзя</p>
          </div>
        ) : user.is_muted ? (
          <div className="glass rounded-xl p-6 text-center border border-orange-500/20">
            <Icon name="MicOff" size={28} className="text-orange-400 mx-auto mb-2 opacity-60" />
            <p className="text-muted-foreground text-sm">Вы замьючены — отвечать нельзя</p>
          </div>
        ) : user.is_banned ? (
          <div className="glass rounded-xl p-6 text-center border border-red-500/20">
            <Icon name="Ban" size={28} className="text-red-400 mx-auto mb-2 opacity-60" />
            <p className="text-muted-foreground text-sm">Ваш аккаунт заблокирован</p>
          </div>
        ) : canReply ? (
          <div className="glass-strong rounded-xl p-5 border border-white/10 animate-fade-in">
            <h3 className="font-semibold font-exo text-foreground mb-4 flex items-center gap-2">
              <Icon name="Reply" size={16} className="text-purple-400" />
              Ответить
            </h3>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Напишите ответ..."
              className="glass border-white/10 resize-none mb-3"
              rows={5}
            />
            {replyError && (
              <p className="text-red-400 text-sm flex items-center gap-1 mb-3">
                <Icon name="AlertCircle" size={13} /> {replyError}
              </p>
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleReply}
                disabled={createPostMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white glow-purple"
              >
                {createPostMutation.isPending ? (
                  <Icon name="Loader2" size={14} className="animate-spin" />
                ) : (
                  <Icon name="Send" size={14} />
                )}
                Отправить
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
