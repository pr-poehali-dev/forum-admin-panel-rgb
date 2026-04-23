import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FORUM_API, apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Category, Topic } from "@/lib/types";
import TopicRow from "@/components/forum/TopicRow";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface TopicsResponse {
  topics: Topic[];
  total: number;
  page: number;
  per_page: number;
}

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [createError, setCreateError] = useState("");

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["categories"],
    queryFn: () => apiFetch(FORUM_API, "/categories"),
  });

  const category = categoriesData?.categories.find((c) => c.id === Number(id));

  const { data: topicsData, isLoading } = useQuery<TopicsResponse>({
    queryKey: ["topics", id, page],
    queryFn: () => apiFetch(FORUM_API, `/categories/${id}/topics?page=${page}&per_page=20`),
    enabled: !!id,
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) =>
      apiFetch(FORUM_API, `/categories/${id}/topics`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topics", id] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      setShowCreate(false);
      setNewTitle("");
      setNewContent("");
    },
    onError: (err: { error?: string }) => {
      setCreateError(err?.error ?? "Ошибка создания топика");
    },
  });

  const handleCreate = () => {
    setCreateError("");
    if (!newTitle.trim()) { setCreateError("Укажите заголовок"); return; }
    if (!newContent.trim()) { setCreateError("Напишите первое сообщение"); return; }
    createTopicMutation.mutate({ title: newTitle.trim(), content: newContent.trim() });
  };

  const totalPages = topicsData ? Math.ceil(topicsData.total / topicsData.per_page) : 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-purple-400 transition-colors">Главная</Link>
        <Icon name="ChevronRight" size={14} />
        <span className="text-foreground">{category?.name ?? "Категория"}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-slide-up">
        <div>
          <h1 className="text-3xl font-bold font-exo text-foreground">
            {category?.name ?? "Категория"}
          </h1>
          {category?.description && (
            <p className="text-muted-foreground mt-1">{category.description}</p>
          )}
        </div>
        {user && !user.is_banned && !user.is_muted && (
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-90 glow-purple transition-all duration-200"
          >
            <Icon name="Plus" size={16} />
            Создать топик
          </Button>
        )}
      </div>

      {/* Topics list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : (topicsData?.topics?.length ?? 0) === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Icon name="MessageSquarePlus" size={48} className="text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground text-lg">Топиков пока нет</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Будьте первым!</p>
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          {topicsData?.topics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="glass border-white/10"
          >
            <Icon name="ChevronLeft" size={14} />
          </Button>
          {[...Array(totalPages)].map((_, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => setPage(i + 1)}
              className={`glass border-white/10 ${page === i + 1 ? "bg-purple-600/30 border-purple-500/50 text-purple-300" : ""}`}
            >
              {i + 1}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="glass border-white/10"
          >
            <Icon name="ChevronRight" size={14} />
          </Button>
        </div>
      )}

      {/* Create topic modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="glass-strong border border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-exo shimmer-text">Новый топик</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Заголовок</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Тема обсуждения..."
                className="glass border-white/10"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Первое сообщение</Label>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Напишите текст..."
                className="glass border-white/10 resize-none"
                rows={6}
              />
            </div>
            {createError && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <Icon name="AlertCircle" size={13} />
                {createError}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} className="glass border-white/10">
              Отмена
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createTopicMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white glow-purple"
            >
              {createTopicMutation.isPending ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                <Icon name="Send" size={14} />
              )}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
